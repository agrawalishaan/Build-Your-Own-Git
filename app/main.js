const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
// const print = require("./util/print");

function print(content) {
  process.stdout.write(content + "\n");
}

// create .git folder and its subfolders. Defensively set { recursive: true } in case we refactor
function gitInit() {
  print("initializing...");
  fs.mkdirSync(path.join(__dirname, ".git"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".git", "refs"), { recursive: true });
  // create the HEAD, overwrites if a HEAD exists
  fs.writeFileSync(
    path.join(__dirname, ".git", "HEAD"),
    "ref: refs/heads/master\n"
  );
  print("git repo initialized");
}

function printBlob(blobSHA) {
  const blobPath = path.join(
    __dirname,
    ".git",
    "objects",
    blobSHA.slice(0, 2),
    blobSHA.slice(2)
  );
  const blob = fs.readFileSync(blobPath);
  // decompress the blob
  const decompressedBlob = zlib.inflateSync(blob).toString();
  const content = decompressedBlob.split("\x00")[1]; // not sure where this occurs from, though x00 represents the null byte
  process.stdout.write(content); // pass the test, doesn't write a new line at the end unlike console.log
}

//  hashes and adds it to /objects, and prints the SHA-1 hash
function writeObject(filePath) {
  print(`hashing... ${filePath}`);

  // read the file content and construct the biniary data
  const fileBuffer = fs.readFileSync(path.join(__dirname, filePath));
  const header = `blob ${fileBuffer.length}\0`; // prefix the file content with the header, unique identifoer for each object type + size of the file content + null byte
  const storeData = Buffer.from(header + fileBuffer.toString()); // we hash on binary data, so we convert back to a buffer
  print(`file content string: ${storeData}`);

  // hash the data
  const hash = crypto.createHash("sha1");
  hash.update(storeData);
  const sha1 = hash.digest("hex");
  print(`sha1: ${sha1}`);
  process.stdout.write(sha1); // pass test

  // write the data to /objects
  folder = sha1.slice(0, 2);
  fileName = sha1.slice(2);
  const objectDir = path.join(__dirname, ".git", "objects", folder);
  const objectPath = path.join(objectDir, fileName);
  fs.mkdirSync(objectDir, { recursive: true }); // ensure the directory exists before writing the file
  fs.writeFileSync(objectPath, zlib.deflateSync(storeData)); // git stores compressed data
}

// sources from terminal
const gitCommand = process.argv[2];

if (gitCommand === "init") {
  gitInit();
} else if (gitCommand === "cat-file") {
  const flag = process.argv[3];
  const blobSHA = process.argv[4];
  // pretty print
  if (flag === "-p") {
    printBlob(blobSHA);
  } else {
    throw new Error(`Unknown flag ${flag}`);
  }
} else if (gitCommand === "hash-object") {
  const flag = process.argv[3]; // -w means write to database
  if (flag === "-w") {
    const filePath = process.argv[4];
    writeObject(filePath);
  } else {
    throw new Error(`Unknown flag ${flag}`);
  }
} else {
  throw new Error(`Unknown command ${command}`);
}
