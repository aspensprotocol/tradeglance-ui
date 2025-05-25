import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
    asset: "AVAX",
    name: "Avalanche",
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
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white bg-[#f8fcf4]"
            >
              Wallet 1
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#7E69AB] text-[#7E69AB] hover:bg-[#7E69AB] hover:text-white bg-[#fff5f6]"
            >
              Wallet 2
            </Button>
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
              className="bg-[#0FA0CE] text-white hover:bg-[#1EAEDB] border-none text-xs px-3 py-1 h-auto"
            >
              online
            </Button>
            <span className="text-gray-400 text-xs">version 1.0.0</span>
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
