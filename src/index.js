const { setupDEK } = require("./setup-dek");
const yargs = require("yargs");

// Define your command-line options
const args = yargs
  .option("cleanDb", {
    describe: "Flag to clean the database",
    type: "boolean",
  })
  .option("cleanCollection", {
    describe: "Flag to clean the vault collection and setup new one",
    type: "boolean",
  }).argv;

function init() {
  setupDEK(args);
}

init();
