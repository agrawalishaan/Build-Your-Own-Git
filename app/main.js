const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

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
  // console.log(`trying to read blob file from SHA: ${blobSHA}`);
  const blobPath = path.join(
    __dirname,
    ".git",
    "objects",
    blobSHA.slice(0, 2),
    blobSHA.slice(2)
  );
  // console.log(`the blob path: ${blobPath}`);
  const blob = fs.readFileSync(blobPath);
  // console.log(`the blob: ${blob}`);
  // decompress the blob
  const decompressedBlob = zlib.inflateSync(blob).toString();
  // console.log(`the decompressed blob: ${decompressedBlob}`);
  const content = decompressedBlob.split("\x00")[1]; // not sure where this occurs from, though x00 represents the null byte
  // console.log(`the content is: ${content}`);
  process.stdout.write(content); // pass the test, doesn't write a new line at the end unlike console.log
}

// takes in a file name or path, hashes and adds it to /objects, then prints the SHA-1 hash
function hashFile(fileNameOrPath) {
  console.log(`hash file called on: ${fileNameOrPath}`);
  const fileContent = fs.readFileSync(path.join(__dirname, fileNameOrPath));
  console.log(
    `file content: ${fileContent}, and its type: ${typeof fileContent}`
  );
  const fileContentString = fileContent.toString();
  console.log(`file content string: ${fileContentString}`);
  // const fileHash = hashObject(fileContentString);
}

// sources from terminal
const gitCommand = process.argv[2];

if (gitCommand === "init") {
  gitInit();
} else if (gitCommand === "cat-file") {
  const flag = process.argv[3];
  const blobSHA = process.argv[4];
  if (flag === "-p") {
    // pretty print
    printBlob(blobSHA);
  } else {
    throw new Error(`Unknown flag ${flag}`);
  }
} else if (gitCommand === "hash-object") {
  const flag = process.argv[3]; // -w means write to database
  if (flag === "-w") {
    const fileNameOrPath = process.argv[4];
    hashFile(fileNameOrPath);
  } else {
    throw new Error(`Unknown flag ${flag}`);
  }
} else {
  throw new Error(`Unknown command ${command}`);
}
