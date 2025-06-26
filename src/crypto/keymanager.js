import * as openpgp from "openpgp";

export const generateKeypair = async (email, passphrase) => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "rsa",
    rsaBits: 2048,
    userIDs: [{ name: email }],
    format: "armored",
    passphrase,
  });

  return { privateKey, publicKey };
};

export const saveKeysToStorage = ({ privateKey, publicKey }) => {
  localStorage.setItem("pgpPublicKey", publicKey);
  localStorage.setItem("pgpPrivateKey", privateKey); 
};

export const loadKeysFromStorage = () => ({
  publicKey: localStorage.getItem("pgpPublicKey"),
  privateKey: localStorage.getItem("pgpPrivateKey"),
});
