
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <div className="min-h-screen bg-neutral-soft/30">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Overview of your cryptocurrency holdings</p>
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
    </div>
  );
};

export default Portfolio;
