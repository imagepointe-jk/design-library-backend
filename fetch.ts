import { errorMessages } from "./constants";
import { NOT_AUTHENTICATED, OK } from "./statusCodes";
import { DropboxCredentials } from "./types";

let accessToken: string | undefined = undefined;
const apiURL = "https://api.dropboxapi.com";
const imageUrlCache: { [key: string]: string } = {};

async function updateDropboxAccessToken({
  appKey,
  appSecret,
  refreshToken,
}: DropboxCredentials) {
  const headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("refresh_token", refreshToken);
  urlencoded.append("grant_type", "refresh_token");
  urlencoded.append("client_id", appKey);
  urlencoded.append("client_secret", appSecret);

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: urlencoded,
  };

  const result = await fetch(`${apiURL}/oauth2/token`, requestOptions);
  if (!result.ok) {
    console.error(
      `Received a ${result.status} error while trying to get a Dropbox access token`
    );
    throw new Error(errorMessages.serverError);
  }

  const json = await result.json();
  accessToken = json["access_token"];
}

export async function getDropboxFileURL(
  filePath: string,
  credentials: DropboxCredentials
): Promise<string> {
  const cachedUrl = imageUrlCache[filePath];
  if (cachedUrl !== undefined) return cachedUrl;

  if (!accessToken) await updateDropboxAccessToken(credentials);

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", `Bearer ${accessToken}`);

  const raw = JSON.stringify({
    path: filePath,
  });

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: raw,
  };

  const url = `${apiURL}/2/files/get_temporary_link`;
  let response = await fetch(url, requestOptions);
  let status = response.status;

  //if we failed to get the link for some reason other than authentication, give up
  if (!response.ok && status !== NOT_AUTHENTICATED) {
    console.error(
      `Received a ${status} error while trying to get an image url for ${filePath}`
    );
    throw new Error(errorMessages.serverError);
  }

  let json = await response.json();
  //if our current access token is expired, get a new one, then try again
  if (
    status === NOT_AUTHENTICATED &&
    json["error_summary"] === "expired_access_token/"
  ) {
    await updateDropboxAccessToken(credentials);
    response = await fetch(url, requestOptions);
    status = response.status;
    if (response.ok) json = await response.json();
  }

  //if we tried again and it still didn't work, give up
  if (status !== OK) {
    console.error(
      `Received a ${status} error while trying to get an image url for ${filePath}`
    );
    throw new Error(errorMessages.serverError);
  }

  imageUrlCache[filePath] = json.link;
  return json.link;
}
