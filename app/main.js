const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
// const print = require("./util/print.js");

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

// view the contents of a blob object
function catFile(blobSHA) {
  const blobPath = path.join(
    __dirname,
    ".git",
    "objects",
    blobSHA.slice(0, 2),
    blobSHA.slice(2)
  );
  const blob = fs.readFileSync(blobPath);

  // decompress and read the blob
  const decompressedBlob = zlib.inflateSync(blob).toString();
  const content = decompressedBlob.split("\x00")[1]; // not sure where this occurs from, though x00 represents the null byte
  process.stdout.write(content);
}

//  hashes and adds it to /objects, and prints the SHA-1 hash
function writeObject(filePath) {
  print(`hashing... ${filePath}`);

  // read the file content and construct the biniary data
  const fileBuffer = fs.readFileSync(path.join(__dirname, filePath));
  const header = `blob ${fileBuffer.length}\0`; // prefix the file content with the header, unique identifier for each object type + size of the file content + null byte
  const storeData = Buffer.from(header + fileBuffer.toString()); // we hash on binary data, so we convert back to a buffer
  print(`file content string: ${storeData}`);

  // hash the data
  const hash = crypto.createHash("sha1");
  hash.update(storeData);
  const sha1 = hash.digest("hex");
  print(`sha1: ${sha1}`);
  process.stdout.write(sha1);

  // write the data to /objects
  folder = sha1.slice(0, 2);
  fileName = sha1.slice(2);
  const objectDir = path.join(__dirname, ".git", "objects", folder);
  const objectPath = path.join(objectDir, fileName);
  fs.mkdirSync(objectDir, { recursive: true });
  fs.writeFileSync(objectPath, zlib.deflateSync(storeData)); // git stores compressed data
}

// function parseTreeEntry(entry) {
//   print(`entry: ${entry}`);
//   for (let i = 0; i < entry.length - 1; i++) {
//     if (entry.slice(i, i + 2) === "\\u") {
//       return entry.slice(0, i);
//     }
//   }
//   throw new Error("Unable to parse tree entry");
// }

function parseTreeObject(data) {
  let i = 0;
  const filenames = [];

  while (i < data.length) {
    // Skip the mode
    while (data[i] !== 32) {
      // ASCII for space
      i++;
    }
    i++; // skip the space

    // Extract the filename
    const startOfFilename = i;
    while (data[i] !== 0) {
      // ASCII for null
      i++;
    }
    const filename = data.slice(startOfFilename, i).toString();
    filenames.push(filename);

    // Skip the SHA-1
    i += 21; // 1 for the null byte, 20 for the SHA-1
  }

  return filenames;
}

// [mode] [file/folder name]\0[SHA-1 of referencing blob or tree]
function parseTree(buffer) {
  const entries = [];

  let i = buffer.indexOf(0) + 1; // searching for the first null byte (00000000), marks the end of the header

  while (i < buffer.length) {
    const nextSpaceIndex = buffer.indexOf(32, i); // find the next space, 32=ASCII for space
    const nextNullByteIndex = buffer.indexOf(0, nextSpaceIndex);
    const mode = buffer.slice(i, spaceIndex).toString();
    const path = buffer.slice(spaceIndex + 1, nextNullByteIndex).toString();

    // SHA-1 is the 20 bytes following the null byte
    const sha1 = buffer.slice(nullIndex + 1, nullIndex + 21);
    const sha1Hex = sha1.toString("hex");

    entries.push({ mode, path, sha1: sha1Hex });

    // move to the next entry
    i = nullIndex + 21;
  }

  return entries;
}

function inspectTree(treeSHA) {
  const treePath = path.join(
    __dirname,
    ".git",
    "objects",
    treeSHA.slice(0, 2),
    treeSHA.slice(2)
  );
  const tree = fs.readFileSync(treePath);

  // decompress and read the tree
  const decompressedTree = zlib.inflateSync(tree);
  const entries = parseTree(decompressedTree);
  const names = entries.map((entry) => entry.path).sort(); // git always sorts the entries

  process.stdout.write(names.join("\n") + "\n");
}

const gitCommand = process.argv[2];

if (gitCommand === "init") {
  gitInit();
} else if (gitCommand === "cat-file") {
  const flag = process.argv[3];
  const blobSHA = process.argv[4];
  if (flag === "-p") {
    // pretty print
    catFile(blobSHA);
  } else {
    throw new Error(`Unknown flag ${flag}`);
  }
} else if (gitCommand === "hash-object") {
  const flag = process.argv[3]; // -w means write to database
  if (flag === "-w") {
    const filePath = process.argv[4];
    writeObject(filePath);
  }
} else if (gitCommand === "ls-tree") {
  const flag = process.argv[3];
  const treeSHA = process.argv[4];
  if (flag === "--name-only") {
    inspectTree(treeSHA);
  } else {
    throw new Error(`Unknown flag ${flag}`);
  }
} else {
  throw new Error(`Unknown command ${command}`);
}
