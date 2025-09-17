import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  recipient?: string;
  sender?: string;
  note?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  className?: string;
}

const TransactionHistory = ({ transactions, className = "" }: TransactionHistoryProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-400/20 text-green-400 border-green-400/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-400/20 text-red-400 border-red-400/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-white/10 overflow-hidden ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10">
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead className="text-right">Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="border-b border-white/5 hover:bg-white/5">
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {tx.type === 'send' ? (
                    <ArrowUpRight className="w-4 h-4 mr-2 text-red-400" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 mr-2 text-green-400" />
                  )}
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </div>
              </TableCell>
              <TableCell className={`font-semibold ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                {tx.type === 'send' ? '-' : '+'} {tx.amount} {tx.currency}
              </TableCell>
              <TableCell>{getStatusBadge(tx.status)}</TableCell>
              <TableCell>{format(new Date(tx.timestamp), 'MMM d, yyyy')}</TableCell>
              <TableCell className="font-mono text-sm">
                {tx.type === 'send' 
                  ? tx.recipient ? formatAddress(tx.recipient) : 'N/A'
                  : tx.sender ? formatAddress(tx.sender) : 'N/A'}
              </TableCell>
              <TableCell className="text-right text-muted-foreground truncate max-w-[200px]">
                {tx.note || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionHistory;
