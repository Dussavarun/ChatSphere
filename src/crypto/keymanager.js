import * as openpgp from "openpgp";

export const generateKeypair = async (email, passphrase) => {
  try {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: "rsa",
      rsaBits: 2048,
      userIDs: [{ name: email, email: email }],
      format: "armored",
      passphrase,
    });

    return { privateKey, publicKey };
  } catch (error) {
    console.error("Error generating keypair:", error);
    throw new Error("Failed to generate keypair");
  }
};

export const saveKeysToStorage = ({ privatekey, publickey }) => {
  try {
    localStorage.setItem("pgpPublicKey", publickey);
    localStorage.setItem("pgpPrivateKey", privatekey);
    console.log("Keys saved to localStorage successfully");
  } catch (error) {
    console.error("Error saving keys to localStorage:", error);
    throw new Error("Failed to save keys to storage");
  }
};

export const loadKeysFromStorage = () => {
  try {
    return {
      publicKey: localStorage.getItem("pgpPublicKey"),
      privateKey: localStorage.getItem("pgpPrivateKey"),
    };
  } catch (error) {
    console.error("Error loading keys from localStorage:", error);
    return { publicKey: null, privateKey: null };
  }
};

export const clearKeysFromStorage = () => {
  try {
    localStorage.removeItem("pgpPublicKey");
    localStorage.removeItem("pgpPrivateKey");
    console.log("Keys cleared from localStorage");
  } catch (error) {
    console.error("Error clearing keys from localStorage:", error);
  }
};