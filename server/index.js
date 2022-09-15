const express = require("express");

const app = express();

app.get("/:nip/:numer_konta", (req, res) => {
  const nip = req.params.nip;
  const numer_konta = req.params.numer_konta;

  res.send(`NIP: ${nip}, numer konta: ${numer_konta}`);
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
