import * as openpgp from 'openpgp';
import { loadKeysFromStorage } from './keymanager';

export const encryptMessage = async (plaintext, recipientPublicKeyArmored) => {
  try {
    // Add validation
    if (!plaintext || !recipientPublicKeyArmored) {
      throw new Error('Missing plaintext or recipient public key');
    }

    console.log('Encrypting message:', plaintext);
    console.log('Using public key:', recipientPublicKeyArmored.substring(0, 100) + '...');

    const publicKey = await openpgp.readKey({ armoredKey: recipientPublicKeyArmored });
    
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plaintext }),
      encryptionKeys: publicKey
    });

    console.log('Encryption successful');
    return encrypted; // This returns the armored encrypted message
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

// 2. Fixed decryptMessage function
export const decryptMessage = async (encryptedMessageArmored, passphrase) => {
  try {
    
    const { privateKey} = loadKeysFromStorage();
    const privateKeyArmored = privateKey;
    console.log("the private key is :", privateKey);

    if (!privateKeyArmored) {
      throw new Error('Private key not found in store');
    }

    if (!encryptedMessageArmored) {
      throw new Error('No encrypted message provided');
    }

    const privateKeyObject = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    
    let decryptedPrivateKey = privateKeyObject;
    
    if (!privateKeyObject.isDecrypted()) {
      try {
        decryptedPrivateKey = await openpgp.decryptKey({
          privateKey: privateKeyObject,
          passphrase
        });
      } catch (err) {
        if (!err.message.includes("already decrypted")) {
          throw new Error(`Failed to decrypt private key: ${err.message}`);
        }
      }
    }

    const message = await openpgp.readMessage({ armoredMessage: encryptedMessageArmored });
    
    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: decryptedPrivateKey
    });

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
};