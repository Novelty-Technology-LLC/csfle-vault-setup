# csfle-vault-setup
Setup Key Vault collection and generate the Data Encryption Key (DEK) required for MongoDB encryption (CSFLE).

## **_Setup `.env` file_**
- Clone the repository.
- Make a copy of .env.example as .env
- Set the required config values in the `.env` file (see [.env.example](.env.example) for reference)

## **_Install packages_**
```bash
# command to install dependencies
$ npm i
```

## **_Run_**
There are 3 scripts to setup the DEK.

### 1. Add DEK in the key vault collection.
```bash
npm run start
```
### 2. Clean key vault collection first and then add new DEK.
```bash
npm run start:c
or
npm run start -- --cleanCollection
```
### 3. Clean entire database and then add new DEK in new key vault collection.
```bash
npm run start:c
or
npm run start -- --cleanDb
```
