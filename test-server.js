async function test() {
  const imgBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  console.log('Testing remove-background...');
  const res1 = await fetch('http://localhost:3000/api/remove-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: imgBase64 })
  });
  console.log('Status:', res1.status);
  const data1 = await res1.json();
  console.log('Response:', data1);

  console.log('Testing analyze-item...');
  const res2 = await fetch('http://localhost:3000/api/gemini/analyze-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: data1.imageUrl, profileId: 'danish' })
  });
  console.log('Status:', res2.status);
  const data2 = await res2.json();
  console.log('Response:', data2);
}
test();
