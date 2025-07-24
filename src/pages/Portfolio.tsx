import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";

const attestationData = {
  "tee_tcb_svn": "06010300000000000000000000000000",
  "mr_seam": "5b38e33a6487958b72c3c12a938eaa5e3fd4510c51aeeab58c7d5ecee41d7c436489d6c8e4f92f160b7cad34207b00c1",
  "mr_signer_seam": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "seam_attributes": "0000000000000000",
  "td_attributes": "0000001000000000",
  "xfam": "e702060000000000",
  "mr_td": "c68518a0ebb42136c12b2275164f8c72f25fa9a34392228687ed6e9caeb9c0f1dbd895e9cf475121c029dc47e70e91fd",
  "mr_config_id": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "mr_owner": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "mr_owner_config": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "rt_mr0": "85e0855a6384fa1c8a6ab36d0dcbfaa11a5753e5a070c08218ae5fe872fcb86967fd2449c29e22e59dc9fec998cb6547",
  "rt_mr1": "9b43f9f34a64bc7191352585be0da1774a1499e698ba77cbf6184547d53d1770d6524c1cfa00b86352f273fc272a8cfe",
  "rt_mr2": "7cc2dadd5849bad220ab122c4fbf25a74dc91cc12702447d3b5cac0f49b2b139994f5cd936b293e5f0f14dea4262d668",
  "rt_mr3": "2c482b5b34f6902293bc203696f407241bfa319d2410a04c604d1021888d6028bf4bd280ff859ee270a0429aac5f0d82",
  "report_data": "afab9790acb13c4c651c1933a22b5f0663ef22927120dd08cc8291d7e0912d8b1c36eb75cf661a64735042f8e81bbe42cb9ab310ca95bf8d36c44cb8835c901f"
};

const portfolioData = [
  {
    asset: "BTC",
    name: "Bitcoin",
    amount: "0.125",
    value: "$3,750.00",
    change: "+2.45%",
    changeType: "positive"
  },
  {
    asset: "ETH",
    name: "Ethereum",
    amount: "2.5",
    value: "$5,250.00",
    change: "+1.23%",
    changeType: "positive"
  },
  {
    asset: "SOL",
    name: "Solana",
    amount: "15.0",
    value: "$1,875.00",
    change: "-0.85%",
    changeType: "negative"
  },
  {
    asset: "FLR",
    name: "Flare",
    amount: "8.75",
    value: "$875.00",
    change: "+3.12%",
    changeType: "positive"
  },
];

const Portfolio = () => {
  return (
    <div className="min-h-screen bg-neutral-soft/30 relative pb-12">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/portfolio" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Portfolio
            </Link>
            <Link to="/trade" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Trade
            </Link>
            <Link to="/bridge" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Bridge
            </Link>
          </div>
          
          <div className="flex gap-3">
            <WalletButton />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">24h Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.map((item) => (
                  <TableRow key={item.asset}>
                    <TableCell className="font-medium">{item.asset}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.amount}</TableCell>
                    <TableCell className="text-right font-medium">{item.value}</TableCell>
                    <TableCell className={`text-right ${item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">$11,750.00</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">24h Change</p>
                <p className="text-2xl font-bold text-green-600">+$142.50</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 text-xs">
        <div className="container mx-auto flex justify-between items-center">
          <div className="ml-2 flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-green-500 text-white hover:bg-green-600 border-none text-xs px-3 py-1 h-auto"
            >
              online
            </Button>
            <span className="text-gray-400 text-xs">version 1.0.0</span>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-gray-400 text-xs hover:text-[#1EAEDB] ml-2">
                  attestation
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Attestation Data</DialogTitle>
                </DialogHeader>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                  <code>{JSON.stringify(attestationData, null, 2)}</code>
                </pre>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-6 text-[#8E9196]">
            <a href="#" className="hover:text-[#1EAEDB]">Terms</a>
            <a href="#" className="hover:text-[#1EAEDB]">Privacy</a>
            <a href="#" className="hover:text-[#1EAEDB]">Support</a>
            <a href="#" className="hover:text-[#1EAEDB]">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
