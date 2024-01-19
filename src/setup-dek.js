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

const setupKeyVaultDb = async (client, cleanDb, cleanCollection) => {
  const keyVaultDB = client.db(KEY_VAULT_DB_NAME);
  // Drop the Key Vault Collection in case if you need to create new one.
  if (cleanDb) {
    // await keyVaultDB.dropDatabase();
    console.log(
      `Key Vault DB dropped and created new as '${KEY_VAULT_DB_NAME}'.`
    );
  }

  if (cleanCollection) {
    keyVaultDB.dropCollection(KEY_VAULT_COLLECTION_NAME);
    console.log(
      `Key Vault Collection dropped and created new as '${KEY_VAULT_COLLECTION_NAME}'.`
    );

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
  }
};

const setupDEK = async (args) => {
  const { cleanDb, cleanCollection } = args;

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();

    await setupKeyVaultDb(client, cleanDb, cleanCollection);

    const keyVaultNamespace = `${KEY_VAULT_DB_NAME}.${KEY_VAULT_COLLECTION_NAME}`;

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
};

module.exports = { setupDEK };
