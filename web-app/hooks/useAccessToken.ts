import { useCallback, useContext, useEffect } from "react";
import { AccessTokenContext, AccessTokenContextType } from "../utils/context";

const GOOGLE_ACCESS_TOKEN_KEY = "googleAccessToken";

interface GoogleAccessTokenObj {
  accessToken: string;
  expiresAt: number;
}

export function useAccessToken() {
  const { accessToken, setAccessToken } = useContext(
    AccessTokenContext,
  ) as AccessTokenContextType;

  useEffect(() => {
    const storedAccessToken = window.localStorage.getItem(
      GOOGLE_ACCESS_TOKEN_KEY,
    );
    if (!storedAccessToken) return;

    const accessTokenObj: GoogleAccessTokenObj = JSON.parse(storedAccessToken);

    if (Date.now() < accessTokenObj.expiresAt) {
      setAccessToken(accessTokenObj.accessToken);
    } else {
      setAccessToken(null);
      window.localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
    }
  }, [setAccessToken]);

  function storeAccessToken(accessTokenObj: GoogleAccessTokenObj) {
    setAccessToken(accessTokenObj.accessToken);
    window.localStorage.setItem(
      GOOGLE_ACCESS_TOKEN_KEY,
      JSON.stringify(accessTokenObj),
    );
  }

  const removeAccessToken = useCallback(() => {
    setAccessToken(null);
    window.localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
  }, [setAccessToken]);

  return { accessToken, storeAccessToken, removeAccessToken };
}
