const path = require("path");
const fs = require("fs");
const https = require("https");
const directoryPath = path.join(__dirname, "appchains");

const readFile = (fileDir) => {
  let rawdata = fs.readFileSync(fileDir);
  return JSON.parse(rawdata);
};

const writeJSONFile = (data) => {
  const path = __dirname + "/appchains/" + data.name.toLowerCase() + ".json";

  fs.writeFile(path, JSON.stringify(data), (err) => {
    if (err) {
      throw new Error("Unable to crate file: " + err);
    }

    console.log("JSON file for " + data.name + " generated successfully.");
  });
};

const updateHeight = (chain) => {
  if (chain.jsonRPC) {
    var body = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBlockByNumber",
      params: ["latest", false],
      id: 0,
    });

    var options = {
      hostname: chain.jsonRPC.split("/")[2],
      path: chain.jsonRPC.substring(chain.jsonRPC.indexOf("/", 8)),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const request = https
      .request(options, (res) => {
        let data = "";
        res
          .on("data", (chunk) => {
            data += chunk;
          })
          .on("end", () => {
            console.log("Response ended: ", chain.shortName);
            const response = JSON.parse(data);
            const result = response.result;
            if (!result) {
              throw new Error("No data is provided");
            }

            chain.blockNumber = parseInt(result.number, 16);
            chain.blockNumberUpdated = new Date(
              result.timestamp * 1000
            ).toISOString();
            writeJSONFile(chain);
          });
      })
      .on("error", (err) => {
        throw new Error("No data is provided: " + err);
      });

    request.end(body);
  } else {
    console.log("RPC is not provided for " + chain.shortName);
  }
};

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    throw new Error("Unable to scan directory: " + files);
  }

  files.forEach(async (file) => {
    console.log("Reading file: " + file);
    const tmpAppChain = readFile(directoryPath + "/" + file);

    updateHeight(tmpAppChain);
  });
});
