// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPaktToken is IERC20 {
    function mint(address to, uint256 amount) external;

    function burn(uint256 amount) external;
}

error UnhandledPaktType(uint8 paktType);
error UserAlreadyHasActivePaktOfType(uint8 paktType);
error LevelNotAllowed(uint8 paktType, uint8 level);
error IncorrectAmount(uint8 level, uint256 amount);
error NotEnoughAllowance(uint256 amount);
error FailedTransfer(uint256 amount);
error PaktMustBeActive();
error PaktMustNotBeCustom();
error PaktNotFinished();
error GoalNotReached();
error PaktMustBeCustom();
error NeedToPayFee();
error WalletAlreadyLinked(address wallet);
error SourceIdAlreadyLinked(uint256 sourceId);
error NoSourceIdLinked();

/**
 * @title Contract to manage all possible actions on pakts
 * @author Alexandre Bensimon
 */
contract PaktManager is AccessControl {
    struct Pakt {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint8 paktType;
        uint8 level;
        bool active;
        bool success;
        string description;
    }

    struct PaktInfo {
        address user;
        uint256 index;
    }

    IPaktToken private immutable i_paktToken;

    bytes32 public constant PAKT_VERIFIER_ROLE =
        keccak256("PAKT_VERIFIER_ROLE");

    // One week
    uint48 public constant PAKT_DURATION = 7 * 24 * 60 * 60;

    uint256 public s_unlockFundsFee = 0.1 ether;

    uint8 public s_paktTypeCount = 4;
    uint16[6] public s_maxAmountByLevel = [0, 100, 200, 300, 400, 500];
    uint8[6] public s_interestRateByLevel = [0, 8, 9, 10, 11, 12];
    uint8 public s_burnInterestRatio = 4;

    mapping(address => uint256) public s_walletToSourceId;
    mapping(uint256 => address) public s_sourceIdToWallet;
    mapping(address => Pakt[]) public s_pakts;
    mapping(address => mapping(uint8 => bool)) public s_activePaktTypes;

    event WalletAndSourceIdLinked(address indexed wallet, uint256 sourceId);
    event PaktCreated(address indexed user, uint256 paktIndex);
    event PaktVerified(address indexed user, uint256 paktIndex);
    event PaktExtended(address indexed user, uint256 paktIndex);
    event PaktEnded(address indexed user, uint256 paktIndex);

    constructor(address _paktTokenAddress) {
        i_paktToken = IPaktToken(_paktTokenAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    /**
     * @notice Link a wallet and a source id to prevent the use of the same source accounts by multiple wallets
     * @param _wallet The wallet address to link
     * @param _sourceId The source id to link
     */
    function linkWalletAndSourceId(address _wallet, uint256 _sourceId)
        external
        onlyRole(PAKT_VERIFIER_ROLE)
    {
        if (s_walletToSourceId[_wallet] != 0)
            revert WalletAlreadyLinked(_wallet);
        if (s_sourceIdToWallet[_sourceId] != address(0x0))
            revert SourceIdAlreadyLinked(_sourceId);

        s_walletToSourceId[_wallet] = _sourceId;
        s_sourceIdToWallet[_sourceId] = _wallet;

        emit WalletAndSourceIdLinked(_wallet, _sourceId);
    }

    /**
     * @notice Creates a new pakt
     * @param _paktType Custom pakts are of type 0, other pakt types are between 1 and paktTypeCount-1
     * @param _level For pakts that are not custom, the level represents the difficulty
     * @param _amount The amount to lock. For pakts that are not custom, there is a max amount for each level
     * @param _description For custom pakts, stores the goal written by the user
     */
    function makeNewPakt(
        uint8 _paktType,
        uint8 _level,
        uint256 _amount,
        string calldata _description
    ) external {
        if (s_walletToSourceId[msg.sender] == 0) revert NoSourceIdLinked();

        if (_paktType >= s_paktTypeCount) revert UnhandledPaktType(_paktType);

        if (_paktType != 0 && s_activePaktTypes[msg.sender][_paktType])
            revert UserAlreadyHasActivePaktOfType(_paktType);

        if (_paktType != 0 && !(_level >= 1 && _level <= 5))
            revert LevelNotAllowed(_paktType, _level);

        if (
            _amount == 0 ||
            (_paktType != 0 &&
                _amount > uint256(s_maxAmountByLevel[_level]) * 1e18)
        ) revert IncorrectAmount(_level, _amount);

        if (i_paktToken.allowance(msg.sender, address(this)) < _amount)
            revert NotEnoughAllowance(_amount);

        Pakt memory pakt = Pakt({
            paktType: _paktType,
            level: _level,
            amount: _amount,
            startTime: block.timestamp,
            endTime: block.timestamp + PAKT_DURATION,
            description: _description,
            active: true,
            success: false
        });

        s_pakts[msg.sender].push(pakt);
        s_activePaktTypes[msg.sender][_paktType] = true;

        emit PaktCreated(msg.sender, s_pakts[msg.sender].length - 1);

        i_paktToken.transferFrom(msg.sender, address(this), _amount);
    }

    /**
     * @notice Extends an already existing pakt
     * @param _paktIndex The index in the pakt array of the user
     * @param _amount The amount the lock in addition to the amount already locked in the pakt
     */
    function extendPakt(uint256 _paktIndex, uint256 _amount) external {
        Pakt storage s_pakt = s_pakts[msg.sender][_paktIndex];

        if (!s_pakt.active) revert PaktMustBeActive();
        if (s_pakt.endTime > block.timestamp) revert PaktNotFinished();

        if (
            _amount == 0 ||
            (s_pakt.paktType != 0 &&
                _amount > uint256(s_maxAmountByLevel[s_pakt.level]) * 1e18)
        ) revert IncorrectAmount(s_pakt.level, _amount);

        if (i_paktToken.allowance(msg.sender, address(this)) < _amount)
            revert NotEnoughAllowance(_amount);

        s_pakt.endTime += PAKT_DURATION;
        s_pakt.amount += _amount;

        emit PaktExtended(msg.sender, _paktIndex);

        i_paktToken.transferFrom(msg.sender, address(this), _amount);
    }

    /**
     * @notice After verification, mark that a pakt has been a success. This function can only be called by the Pakt Verifier
     * @param _paktOwner The address of the owner whose pakt to be verified
     * @param _paktIndex The index in the pakt array of the user
     */
    function markPaktVerified(address _paktOwner, uint256 _paktIndex)
        external
        onlyRole(PAKT_VERIFIER_ROLE)
    {
        Pakt storage s_pakt = s_pakts[_paktOwner][_paktIndex];

        if (!s_pakt.active) revert PaktMustBeActive();
        if (s_pakt.paktType == 0) revert PaktMustNotBeCustom();
        if (s_pakt.endTime > block.timestamp) revert PaktNotFinished();

        s_pakt.success = true;

        emit PaktVerified(_paktOwner, _paktIndex);
    }

    /**
     * @notice After a pakt has been verified, the user can unlock the funds
     * @param _paktIndex The index in the pakt array of the user
     */
    function unlockFunds(uint256 _paktIndex) external payable {
        if (msg.value < s_unlockFundsFee) revert NeedToPayFee();

        Pakt storage s_pakt = s_pakts[msg.sender][_paktIndex];

        if (!s_pakt.active) revert PaktMustBeActive();
        if (!s_pakt.success) revert GoalNotReached();

        s_pakt.active = false;
        s_activePaktTypes[msg.sender][s_pakt.paktType] = false;

        emit PaktEnded(msg.sender, _paktIndex);

        uint256 interest = computeInterestForAmount(
            s_pakt.amount,
            s_pakt.level
        );

        i_paktToken.mint(address(this), interest);
        i_paktToken.transfer(msg.sender, s_pakt.amount + interest);
    }

    /**
     * @notice If the pakt is not successful, the user can call this function to archive the pakt and recover some of the tokens locked
     * @param _paktIndex The index in the pakt array of the user
     */
    function failPakt(uint256 _paktIndex) external {
        Pakt storage s_pakt = s_pakts[msg.sender][_paktIndex];

        if (!s_pakt.active) revert PaktMustBeActive();
        if (s_pakt.paktType == 0) revert PaktMustNotBeCustom();
        if (s_pakt.endTime > block.timestamp) revert PaktNotFinished();

        s_pakt.active = false;
        s_activePaktTypes[msg.sender][s_pakt.paktType] = false;

        emit PaktEnded(msg.sender, _paktIndex);

        uint256 interest = computeInterestForAmount(
            s_pakt.amount,
            s_pakt.level
        );
        uint256 burnAmount = s_burnInterestRatio * interest;

        i_paktToken.burn(burnAmount);

        i_paktToken.transfer(msg.sender, s_pakt.amount - burnAmount);
    }

    /**
     * @notice End a custom pakt
     * @param _paktIndex The index in the pakt array of the user
     * @param _isPaktSuccess For a custom pakt, there is no verification by API so the user must specify if the pakt is successful or not
     */
    function endCustomPakt(uint256 _paktIndex, bool _isPaktSuccess) external {
        Pakt storage s_pakt = s_pakts[msg.sender][_paktIndex];

        if (!s_pakt.active) revert PaktMustBeActive();
        if (s_pakt.paktType != 0) revert PaktMustBeCustom();
        if (s_pakt.endTime > block.timestamp) revert PaktNotFinished();

        s_pakt.active = false;

        if (_isPaktSuccess) {
            s_pakt.success = true;

            emit PaktEnded(msg.sender, _paktIndex);

            i_paktToken.transfer(msg.sender, s_pakt.amount);
        } else {
            emit PaktEnded(msg.sender, _paktIndex);

            i_paktToken.burn(s_pakt.amount);
        }
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) revert FailedTransfer(address(this).balance);
    }

    /**
     * @dev If new pakts are added, can use this function to handle new pakt types without deploying new contract
     */
    function setPaktTypeCount(uint8 _count)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        s_paktTypeCount = _count;
    }

    /**
     * @dev For tweeking authorized token ranges by level if necessary during beta phase
     */
    function setMaxAmountByLevel(uint16[6] calldata _maxAmountByLevel)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        s_maxAmountByLevel = _maxAmountByLevel;
    }

    /**
     * @dev For tweeking authorized interest rate by level if necessary during beta phase
     */
    function setInterestRateByLevel(uint8[6] calldata _interestRateByLevel)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        s_interestRateByLevel = _interestRateByLevel;
    }

    /**
     * @dev For tweeking amount of token burned when pakt is not successful if necessary during beta phase
     */
    function setBurnInterestRatio(uint8 _burnInterestRatio)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        s_burnInterestRatio = _burnInterestRatio;
    }

    /**
     * @dev For tweeking the unlock funds fee if necessary
     */
    function setUnlockFundsFee(uint256 _unlockFundsFee)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        s_unlockFundsFee = _unlockFundsFee;
    }

    /**
     * @dev Getter necessary to get full array
     */
    function getMaxAmountByLevel() external view returns (uint16[6] memory) {
        return s_maxAmountByLevel;
    }

    /**
     * @dev Getter necessary to get full array
     */
    function getInterestRateByLevel() external view returns (uint8[6] memory) {
        return s_interestRateByLevel;
    }

    /**
     * @dev Getter necessary to get full array
     */
    function getAllPaktsFromUser(address _user)
        public
        view
        returns (Pakt[] memory)
    {
        return s_pakts[_user];
    }

    /**
     * @notice For each pakt level, an interest rate is calculated on the amount locked and is used as a reward with new tokens minted or as a punishment with tokens burned
     */
    function computeInterestForAmount(uint256 _amount, uint8 _paktLevel)
        public
        view
        returns (uint256)
    {
        // 1% of amount = amount * 10 / 1000
        return (_amount * s_interestRateByLevel[_paktLevel]) / 1000;
    }
}
