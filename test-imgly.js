const { removeBackground } = require('@imgly/background-removal-node');
async function test() {
  const blob = new Blob(["test"], { type: "text/plain" });
  try {
    await removeBackground(blob);
  } catch (e) {
    console.error(e);
  }
}
test();
