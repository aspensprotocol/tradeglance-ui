
import { useState } from "react";
import { File } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Transaction {
  timestamp: string;
  amount: number;
  price: number;
  note: string;
}

interface TransactionTableProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: string[];
}

const TransactionTable = ({ selectedPair, onPairChange, tradingPairs }: TransactionTableProps) => {
  const [transactions] = useState<Transaction[]>([
    { timestamp: "10:23:45", amount: 0.5421, price: 50234.12, note: "Trade #001" },
    { timestamp: "10:22:18", amount: 1.2345, price: 50156.78, note: "Trade #002" },
    { timestamp: "10:21:03", amount: 0.8765, price: 50089.45, note: "Trade #003" },
    { timestamp: "10:19:42", amount: 2.1543, price: 49987.23, note: "Trade #004" },
    { timestamp: "10:18:17", amount: 0.3298, price: 49945.67, note: "Trade #005" },
    { timestamp: "10:16:55", amount: 1.7832, price: 49823.45, note: "Trade #006" },
    { timestamp: "10:15:29", amount: 0.9876, price: 49756.89, note: "Trade #007" },
    { timestamp: "10:14:08", amount: 1.4567, price: 49698.12, note: "Trade #008" },
    { timestamp: "10:12:41", amount: 0.6743, price: 49634.56, note: "Trade #009" },
    { timestamp: "10:11:15", amount: 2.8901, price: 49567.23, note: "Trade #010" },
  ]);

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 border-b">
        <select
          value={selectedPair}
          onChange={(e) => onPairChange(e.target.value)}
          className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
        >
          {tradingPairs.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
      </div>
      
      <div className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Timestamp</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">{transaction.timestamp}</TableCell>
                <TableCell className="text-right font-mono">{transaction.amount.toFixed(4)}</TableCell>
                <TableCell className="text-right font-mono">${transaction.price.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <a 
                    href="#" 
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <File size={14} />
                    {transaction.note}
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;
