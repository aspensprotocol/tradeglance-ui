import { ConfigServiceClient } from './src/proto/grpc_web/arborter_config_grpc_web_pb.js';
import { GetConfigRequest, Empty } from './src/proto/grpc_web/arborter_config_pb.js';

async function testGrpcWebConnection() {
  console.log('Testing gRPC-Web connection...');
  
  const proxyUrl = 'http://localhost:8082';
  const configClient = new ConfigServiceClient(proxyUrl);
  
  try {
    // Test 1: Get version info
    console.log('\n1. Testing GetVersion...');
    const versionRequest = new Empty();
    
    const versionResponse = await new Promise((resolve, reject) => {
      configClient.getVersion(versionRequest, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('✅ GetVersion successful:', versionResponse.toObject());
    
    // Test 2: Get config
    console.log('\n2. Testing GetConfig...');
    const configRequest = new GetConfigRequest();
    
    const configResponse = await new Promise((resolve, reject) => {
      configClient.getConfig(configRequest, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('✅ GetConfig successful:', configResponse.toObject());
    
    console.log('\n🎉 All gRPC-Web tests passed!');
    console.log('Proxy URL:', proxyUrl);
    console.log('Target service: localhost:50051');
    
  } catch (error) {
    console.error('❌ gRPC-Web test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure arborter service is running on localhost:50051');
    console.log('2. Check that the proxy is running: docker-compose ps');
    console.log('3. Verify proxy logs: docker-compose logs envoy');
  }
}

// Run the test
testGrpcWebConnection(); 