const { ClientEncryption, MongoClient } = require("mongodb");
require("dotenv").config();

const {
  MONGO_CLUSTER_NAME,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  // Key Vaults
  KEY_VAULT_DB_NAME,
  KEY_VAULT_COLLECTION_NAME,
  KEY_VAULT_DATA_KEY_NAME,
  // AWS Credentials
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_REGION,
  AWS_ARN,
} = process.env;

// Mongo Paths + URI
const MONGODB_URI = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER_NAME}.mongodb.net/?retryWrites=true&w=majority`;

async function setupKeyVaultDb() {
  const keyVaultClient = new MongoClient(MONGODB_URI);

  try {
    await keyVaultClient.connect();
    const keyVaultDB = keyVaultClient.db(KEY_VAULT_DB_NAME);
    // Drop the Key Vault Collection in case if you need to create new one.
    // await keyVaultDB.dropDatabase();
    // console.log('Key Vault Db dropped and new created.');

    keyVaultDB.dropCollection(KEY_VAULT_COLLECTION_NAME);
    console.log("Key Vault Collection dropped and new created.");

    // start-create-index
    const keyVaultCol = keyVaultDB.collection(KEY_VAULT_COLLECTION_NAME);
    await keyVaultCol.createIndex(
      { keyAltNames: 1 },
      {
        unique: true,
        partialFilterExpression: { keyAltNames: { $exists: true } },
      }
    );
    // end-create-index
    console.log("Collection Index created.");
  } catch (err) {
    console.log(err);
  } finally {
    await keyVaultClient.close();
  }
}

async function init(isSetupKeyVaultDb = false) {
  if (isSetupKeyVaultDb) await setupKeyVaultDb();

  const client = new MongoClient(MONGODB_URI);

  try {
    const keyVaultNamespace = `${KEY_VAULT_DB_NAME}.${KEY_VAULT_COLLECTION_NAME}`;
    await client.connect();

    const encryption = new ClientEncryption(client, {
      keyVaultNamespace,
      kmsProviders: {
        aws: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY },
      },
    });
    // start-create-dek
    const options = {
      masterKey: { key: AWS_ARN, region: AWS_REGION },
      keyAltNames: [KEY_VAULT_DATA_KEY_NAME],
    };
    const key = await encryption.createDataKey("aws", options);
    // end-create-dek

    console.log("DataKeyId [base64]: ", key.toString("base64"));
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

init(true);
