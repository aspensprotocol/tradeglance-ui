import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyBlockquote,
  TypographyList,
  TypographyInlineCode,
  TypographyLead,
  TypographySmall,
} from "@/components/ui/typography";
import { Search, Mail, Lock, Eye, EyeOff } from "lucide-react";

// Sample data for the data table
interface TradeData {
  id: string;
  pair: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  timestamp: string;
  status: "completed" | "pending" | "cancelled";
  txHash: string;
}

const sampleTrades: TradeData[] = [
  {
    id: "1",
    pair: "ETH/USDC",
    side: "buy",
    amount: 0.5,
    price: 2500.5,
    timestamp: "2024-01-15 14:30:00",
    status: "completed",
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "2",
    pair: "BTC/USDT",
    side: "sell",
    amount: 0.1,
    price: 45000.0,
    timestamp: "2024-01-15 14:25:00",
    status: "pending",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: "3",
    pair: "SOL/USDC",
    side: "buy",
    amount: 10,
    price: 95.75,
    timestamp: "2024-01-15 14:20:00",
    status: "completed",
    txHash: "0x7890abcdef1234567890abcdef1234567890abcd",
  },
  {
    id: "4",
    pair: "MATIC/USDT",
    side: "sell",
    amount: 100,
    price: 0.85,
    timestamp: "2024-01-15 14:15:00",
    status: "cancelled",
    txHash: "0x4567890abcdef1234567890abcdef1234567890ab",
  },
];

const IntegratedMaterializeDemo = (): JSX.Element => {
  const [inputValue, setInputValue] = React.useState("");
  const [emailValue, setEmailValue] = React.useState("");
  const [passwordValue, setPasswordValue] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("components");
  const [progressValue] = React.useState(65);
  const [switchValue, setSwitchValue] = React.useState(false);

  // Data table columns
  const tradeColumns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "pair",
      header: "Trading Pair",
      width: "120px",
    },
    {
      key: "side",
      header: "Side",
      cell: (value) => (
        <Badge
          variant={
            (value as TradeData["side"]) === "buy" ? "default" : "destructive"
          }
        >
          {(value as TradeData["side"]).toUpperCase()}
        </Badge>
      ),
      width: "80px",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (value) => (
        <span className="font-mono">{value as TradeData["amount"]}</span>
      ),
      width: "100px",
    },
    {
      key: "price",
      header: "Price",
      cell: (value) => (
        <span className="font-mono">
          ${(value as TradeData["price"]).toLocaleString()}
        </span>
      ),
      width: "120px",
    },
    {
      key: "timestamp",
      header: "Time",
      width: "150px",
    },
    {
      key: "status",
      header: "Status",
      cell: (value) => {
        const statusValue = value as TradeData["status"];
        const variants: Record<
          TradeData["status"],
          "default" | "secondary" | "destructive"
        > = {
          completed: "default",
          pending: "secondary",
          cancelled: "destructive",
        };
        return <Badge variant={variants[statusValue]}>{statusValue}</Badge>;
      },
      width: "100px",
    },
  ];

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Integrated Materialize Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
              <TabsTrigger value="data-table">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="components">
              <main className="grid gap-6">
                <section className="space-y-4">
                  <TypographyH3>Enhanced Input Components</TypographyH3>

                  <section className="grid gap-4">
                    <article className="space-y-2">
                      <TypographySmall>
                        Search Input with Left Icon
                      </TypographySmall>
                      <Input
                        placeholder="Search..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                      />
                    </article>

                    <article className="space-y-2">
                      <TypographySmall>
                        Email Input with Left Icon
                      </TypographySmall>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        leftIcon={<Mail className="h-4 w-4" />}
                        inputSize="lg"
                      />
                    </article>

                    <article className="space-y-2">
                      <TypographySmall>
                        Password Input with Icons
                      </TypographySmall>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={passwordValue}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        leftIcon={<Lock className="h-4 w-4" />}
                        rightIcon={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        }
                      />
                    </article>

                    <article className="space-y-2">
                      <TypographySmall>Materialize Style Input</TypographySmall>
                      <Input
                        placeholder="Materialize styled input"
                        variant="materialize"
                        leftIcon={<Search className="h-4 w-4" />}
                        inputSize="lg"
                      />
                    </article>

                    <article className="space-y-2">
                      <TypographySmall>Error State Input</TypographySmall>
                      <Input
                        placeholder="Input with error"
                        error={true}
                        leftIcon={<Mail className="h-4 w-4" />}
                      />
                    </article>
                  </section>
                </section>

                <Separator />

                <section className="space-y-4">
                  <TypographyH3>Other Components</TypographyH3>

                  <nav className="flex items-center gap-2">
                    <Badge variant="default">Default Badge</Badge>
                    <Badge variant="secondary">Secondary Badge</Badge>
                    <Badge variant="destructive">Destructive Badge</Badge>
                  </nav>

                  <nav className="flex items-center gap-2">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Badge variant="default">Hover over me</Badge>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <p>This is a hover card content.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </nav>

                  <section className="flex items-center gap-2">
                    <Progress value={progressValue} />
                  </section>

                  <section className="flex items-center gap-2">
                    <Switch
                      checked={switchValue}
                      onCheckedChange={setSwitchValue}
                    />
                  </section>

                  <section className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Popover</Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <p>This is a popover content.</p>
                      </PopoverContent>
                    </Popover>
                  </section>

                  <article className="space-y-2">
                    <TypographySmall>Scrollable Content</TypographySmall>
                    <ScrollArea className="h-32 w-full border rounded-md p-4">
                      <p>Scrollable content goes here...</p>
                      <p>Scrollable content goes here...</p>
                      <p>Scrollable content goes here...</p>
                      <p>Scrollable content goes here...</p>
                      <p>Scrollable content goes here...</p>
                    </ScrollArea>
                  </article>
                </section>
              </main>
            </TabsContent>

            <TabsContent value="typography">
              <main className="space-y-6">
                <TypographyH1>
                  Taxing Laughter: The Joke Tax Chronicles
                </TypographyH1>

                <TypographyLead>
                  Once upon a time, in a far-off land, there was a very lazy
                  king who spent all day lounging on his throne. One day, his
                  advisors came to him with a problem: the kingdom was running
                  out of money.
                </TypographyLead>

                <TypographyH2>The King's Plan</TypographyH2>
                <TypographyP>
                  The king thought long and hard, and finally came up with{" "}
                  <a
                    href="#"
                    className="text-primary font-medium underline underline-offset-4"
                  >
                    a brilliant plan
                  </a>
                  : he would tax the jokes in the kingdom.
                </TypographyP>

                <TypographyBlockquote>
                  "After all," he said, "everyone enjoys a good joke, so it's
                  only fair that they should pay for the privilege."
                </TypographyBlockquote>

                <TypographyH3>The Joke Tax</TypographyH3>
                <TypographyP>
                  The king's subjects were not amused. They grumbled and
                  complained, but the king was firm:
                </TypographyP>

                <TypographyList>
                  <li>1st level of puns: 5 gold coins</li>
                  <li>2nd level of jokes: 10 gold coins</li>
                  <li>3rd level of one-liners: 20 gold coins</li>
                </TypographyList>

                <TypographyP>
                  As a result, people stopped telling jokes, and the kingdom
                  fell into a gloom. But there was one person who refused to let
                  the king's foolishness get him down: a court jester named
                  Jokester.
                </TypographyP>

                <TypographyH3>Jokester's Revolt</TypographyH3>
                <TypographyP>
                  Jokester began sneaking into the castle in the middle of the
                  night and leaving jokes all over the place: under the king's
                  pillow, in his soup, even in the royal toilet. The king was
                  furious, but he couldn't seem to stop Jokester.
                </TypographyP>

                <TypographyP>
                  And then, one day, the people of the kingdom discovered that
                  the jokes left by Jokester were so funny that they couldn't
                  help but laugh. And once they started laughing, they couldn't
                  stop.
                </TypographyP>

                <TypographyH3>The People's Rebellion</TypographyH3>
                <TypographyP>
                  The people of the kingdom, feeling uplifted by the laughter,
                  started to tell jokes and puns again, and soon the entire
                  kingdom was in on the joke.
                </TypographyP>

                <section className="my-6 w-full overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="even:bg-muted m-0 border-t p-0">
                        <th className="border px-4 py-2 text-left font-bold">
                          King's Treasury
                        </th>
                        <th className="border px-4 py-2 text-left font-bold">
                          People's happiness
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="even:bg-muted m-0 border-t p-0">
                        <td className="border px-4 py-2 text-left">Empty</td>
                        <td className="border px-4 py-2 text-left">
                          Overflowing
                        </td>
                      </tr>
                      <tr className="even:bg-muted m-0 border-t p-0">
                        <td className="border px-4 py-2 text-left">Modest</td>
                        <td className="border px-4 py-2 text-left">
                          Satisfied
                        </td>
                      </tr>
                      <tr className="even:bg-muted m-0 border-t p-0">
                        <td className="border px-4 py-2 text-left">Full</td>
                        <td className="border px-4 py-2 text-left">Ecstatic</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <TypographyP>
                  The king, seeing how much happier his subjects were, realized
                  the error of his ways and repealed the joke tax. Jokester was
                  declared a hero, and the kingdom lived happily ever after.
                </TypographyP>

                <TypographyP>
                  The moral of the story is: never underestimate the power of a
                  good laugh and always be careful of bad ideas. You can use{" "}
                  <TypographyInlineCode>
                    @radix-ui/react-alert-dialog
                  </TypographyInlineCode>{" "}
                  for important dialogs.
                </TypographyP>
              </main>
            </TabsContent>

            <TabsContent value="avatar">
              <main className="space-y-6">
                <TypographyH3>Avatar Components for Token Logos</TypographyH3>
                <TypographyP>
                  The Avatar component is perfect for displaying token logos
                  from CoinGecko with fallbacks and consistent sizing.
                </TypographyP>

                <section className="space-y-4">
                  <article className="space-y-2">
                    <TypographySmall>Different Avatar Sizes</TypographySmall>
                    <nav className="flex items-center gap-4">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                          alt="ETH"
                        />
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          E
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
                          alt="BTC"
                        />
                        <AvatarFallback className="bg-orange-500 text-white text-xs">
                          B
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src="https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
                          alt="BNB"
                        />
                        <AvatarFallback className="bg-yellow-500 text-white text-xs">
                          B
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src="https://assets.coingecko.com/coins/images/325/small/Tether.png"
                          alt="USDT"
                        />
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          U
                        </AvatarFallback>
                      </Avatar>
                    </nav>
                  </article>

                  <Separator />

                  <article className="space-y-2">
                    <TypographySmall>
                      Token Trading Pairs with Avatars
                    </TypographySmall>
                    <section className="grid gap-3">
                      <article className="flex items-center gap-3 p-3 border rounded-lg">
                        <nav className="flex -space-x-2">
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarImage
                              src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                              alt="ETH"
                            />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              E
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarImage
                              src="https://assets.coingecko.com/coins/images/325/small/Tether.png"
                              alt="USDT"
                            />
                            <AvatarFallback className="bg-green-500 text-white text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                        </nav>
                        <header>
                          <h4 className="font-semibold">ETH/USDT</h4>
                          <p className="text-sm text-gray-500">
                            Ethereum / Tether
                          </p>
                        </header>
                        <Badge variant="default" className="ml-auto">
                          Active
                        </Badge>
                      </article>

                      <article className="flex items-center gap-3 p-3 border rounded-lg">
                        <nav className="flex -space-x-2">
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarImage
                              src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
                              alt="BTC"
                            />
                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                              B
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarImage
                              src="https://assets.coingecko.com/coins/images/325/small/Tether.png"
                              alt="USDT"
                            />
                            <AvatarFallback className="bg-green-500 text-white text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                        </nav>
                        <header>
                          <h4 className="font-semibold">BTC/USDT</h4>
                          <p className="text-sm text-gray-500">
                            Bitcoin / Tether
                          </p>
                        </header>
                        <Badge variant="secondary" className="ml-auto">
                          Pending
                        </Badge>
                      </article>

                      <article className="flex items-center gap-3 p-3 border rounded-lg">
                        <nav className="flex -space-x-2">
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarImage
                              src="https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
                              alt="BNB"
                            />
                            <AvatarFallback className="bg-yellow-500 text-white text-xs">
                              B
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarImage
                              src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                              alt="ETH"
                            />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              E
                            </AvatarFallback>
                          </Avatar>
                        </nav>
                        <header>
                          <h4 className="font-semibold">BNB/ETH</h4>
                          <p className="text-sm text-gray-500">
                            BNB / Ethereum
                          </p>
                        </header>
                        <Badge variant="destructive" className="ml-auto">
                          Closed
                        </Badge>
                      </article>
                    </section>
                  </article>

                  <Separator />

                  <article className="space-y-2">
                    <TypographySmall>User Profile Avatars</TypographySmall>
                    <section className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="User"
                        />
                        <AvatarFallback className="bg-gray-500 text-white">
                          U
                        </AvatarFallback>
                      </Avatar>
                      <header>
                        <h4 className="font-semibold">Trading User</h4>
                        <p className="text-sm text-gray-500">Pro Trader</p>
                      </header>
                    </section>
                  </article>
                </section>
              </main>
            </TabsContent>

            <TabsContent value="data-table">
              <DataTable
                columns={tradeColumns}
                data={sampleTrades as unknown as Record<string, unknown>[]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default IntegratedMaterializeDemo;
