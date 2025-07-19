const http = require('http');

const postData = JSON.stringify({
  continue_stream: true,
  market_id: "84532::0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9::11155420::0xbCF26943C0197d2eE0E5D05c716Be60cc2761508",
  historical_open_orders: true
});

const options = {
  hostname: 'localhost',
  port: 8083,
  path: '/grpc/xyz.aspens.arborter.v1.ArborterService/Orderbook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Grpc-Web': '1',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Connecting to orderbook stream...');
console.log('Request data:', postData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let dataBuffer = '';
  
  res.on('data', (chunk) => {
    const data = chunk.toString();
    dataBuffer += data;
    console.log('Received chunk:', data);
  });
  
  res.on('end', () => {
    console.log('Stream ended');
    console.log('Total data received:', dataBuffer);
  });
  
  res.on('error', (err) => {
    console.error('Response error:', err);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(postData);
req.end();

// Keep the script running for 30 seconds to catch any delayed data
setTimeout(() => {
  console.log('Test completed after 30 seconds');
  process.exit(0);
}, 30000); 