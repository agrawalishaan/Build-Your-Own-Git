const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// sources from terminal
const gitCommand = process.argv[2];

// create .git folder and its subfolders. Defensively set { recursive: true } in case we refactor
function gitInit() {
  console.log(`git init command received`);
  fs.mkdirSync(path.join(__dirname, ".git"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".git", "refs"), { recursive: true });
  // create the HEAD, overwrites if a HEAD exists
  fs.writeFileSync(
    path.join(__dirname, ".git", "HEAD"),
    "ref: refs/heads/master\n"
  );
  console.log("git repository initialized");
}

function printBlob(blobSHA) {
  console.log(`trying to read blob file from SHA: ${blobSHA}`);
  const blobPath = path.join(
    __dirname,
    ".git",
    "objects",
    blobSHA.slice(0, 2),
    blobSHA.slice(2)
  );
  console.log(`the blob path: ${blobPath}`);
  const blob = fs.readFileSync(blobPath);
  console.log(`the blob: ${blob}`);
  // decompress the blob
  const decompressedBlob = zlib.inflateSync(blob).toString();
  console.log(`the decompressed blob: ${decompressedBlob}`);
  // print the blob
  console.log(decompressedBlob);
}

switch (gitCommand) {
  case "init":
    gitInit();
    break;
  case "cat-file":
    const flag = process.argv[3];
    const blobSHA = process.argv[4];
    if (flag === "-p") {
      // pretty print
      printBlob(blobSHA);
    } else {
      throw new Error(`Unknown flag ${flag}`);
    }
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}
