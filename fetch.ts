import { errorMessages } from "./constants";
import { NOT_AUTHENTICATED, OK } from "./statusCodes";
import { DropboxCredentials } from "./types";

let accessToken: string | undefined = undefined;
const apiURL = "https://api.dropboxapi.com";

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
    const json = await result.json();
    console.error(json);
    throw new Error(errorMessages.serverError);
  }

  const json = await result.json();
  accessToken = json["access_token"];
}

export async function downloadTempDb(dropboxCredentials: DropboxCredentials) {
  if (!accessToken) await updateDropboxAccessToken(dropboxCredentials);

  const url = "https://content.dropboxapi.com/2/files/download";
  const path = "/Marketing/Website/Design Library/Design Data.xlsx";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  };
  let response = await fetch(url, options);
  let status = response.status;

  //if we failed to get the link for some reason other than authentication, give up
  if (!response.ok && status !== NOT_AUTHENTICATED) {
    console.error(
      `Received a ${status} error while trying to get the db from dropbox`
    );
    throw new Error(errorMessages.serverError);
  }

  //if our current access token is expired, get a new one, then try again
  if (status === NOT_AUTHENTICATED) {
    await updateDropboxAccessToken(dropboxCredentials);
    options.headers.Authorization = `Bearer ${accessToken}`;
    response = await fetch(url, options);
    status = response.status;
  }

  //if we tried again and it still didn't work, give up
  if (status !== OK) {
    console.error(
      `Received a ${status} error while trying to get the db from dropbox`
    );
    throw new Error(errorMessages.serverError);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
