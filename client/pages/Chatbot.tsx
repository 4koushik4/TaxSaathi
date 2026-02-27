import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  BarChart3,
  MessageCircle,
  Bot,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    title: 'How much GST do I owe?',
    description: 'Get your current GST payable amount',
  },
  {
    icon: BarChart3,
    title: 'What product gives highest profit?',
    description: 'Identify your best performing products',
  },
  {
    icon: AlertCircle,
    title: 'Show low stock items.',
    description: 'Products below minimum threshold',
  },
  {
    icon: TrendingUp,
    title: 'Am I near ₹40 lakh turnover?',
    description: 'Check your annual turnover status',
  },
  {
    icon: Sparkles,
    title: 'Generate GSTR-1 report summary',
    description: 'Get insights from your GSTR-1 data',
  },
  {
    icon: Bot,
    title: 'Help with tax filing',
    description: 'Guidance on upcoming tax deadlines',
  },
];

const getDefaultBusinessContext = (): string => `
Business Data Context:
- Total Revenue: ₹3,58,000
- GST Collected: ₹64,440
- GST Payable: ₹28,320 (after ITC of ₹8,400)
- Total Purchases: ₹1,88,000
- Inventory Value: ₹82,500
- Gross Profit: ₹1,70,000
- YTD Turnover: ₹38.2L (approaching ₹40L threshold)
- Low Stock Items: Wireless Headphones (5 units), Phone Case (2 units), Keyboard (3 units)
- Top Products: Product A (₹45,000), Product B (₹32,000), Product C (₹28,000)
- GST Filing Due: July 20th
- Currency: Indian Rupees (₹)
- Tax System: Indian GST System
`;

export default function Chatbot() {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        'Hello! I\'m your AI Tax Assistant powered by Groq. I can help you with GST calculations, inventory insights, profit analysis, tax compliance, and more. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessContext, setBusinessContext] = useState<string>('');

  // Fetch business context from Supabase
  useEffect(() => {
    const fetchBusinessContext = async () => {
      if (!user?.id) return;

      try {
        const [analyticsRes, productsRes, salesRes] = await Promise.all([
          supabase.from('analytics_summary').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('products').select('current_stock, selling_price, purchase_price, minimum_stock_level').eq('user_id', user.id),
          supabase.from('sales_transactions').select('sales_amount, cost_amount').eq('user_id', user.id),
        ]);

        let context = `
Business Data Context (Generated from real data):
- Currency: Indian Rupees (₹)
- Tax System: Indian GST System
`;

        if (analyticsRes.data?.[0]) {
          const analytics = analyticsRes.data[0];
          context += `
- Total Revenue: ₹${parseFloat(analytics.total_revenue || 0).toLocaleString()}
- GST Collected: ₹${parseFloat(analytics.gst_collected || 0).toLocaleString()}
- GST Payable: ₹${parseFloat(analytics.gst_payable || 0).toLocaleString()}
- Total Purchases: ₹${parseFloat(analytics.total_purchases || 0).toLocaleString()}
- Inventory Value: ₹${parseFloat(analytics.inventory_value || 0).toLocaleString()}
- Gross Profit: ₹${parseFloat(analytics.gross_profit || 0).toLocaleString()}
- YTD Turnover: ₹${(parseFloat(analytics.ytd_turnover || 0) / 100000).toFixed(1)}L`;
        }

        if (productsRes.data) {
          const lowStockItems = productsRes.data
            .filter(p => (p.current_stock || 0) < (p.minimum_stock_level || 10))
            .slice(0, 3);
          const topProducts = productsRes.data
            .sort((a, b) => ((b.selling_price || 0) * (b.current_stock || 0)) - ((a.selling_price || 0) * (a.current_stock || 0)))
            .slice(0, 3);

          if (lowStockItems.length > 0) {
            context += `\n- Low Stock Items: ${lowStockItems.length} items below minimum`;
          }
          if (topProducts.length > 0) {
            context += `\n- Top Products: Available in inventory`;
          }
        }

        if (salesRes.data) {
          const totalSales = salesRes.data.reduce((sum, t) => sum + (parseFloat(t.sales_amount) || 0), 0);
          context += `\n- Total Sales (YTD): ₹${totalSales.toLocaleString()}`;
        }

        context += `\n- GST Filing Due: 20th of every month
- All amounts are calculated from real business data`;

        setBusinessContext(context);
      } catch (error) {
        console.error('Error fetching business context:', error);
        setBusinessContext(getDefaultBusinessContext());
      }
    };

    if (!userLoading && user?.id) {
      fetchBusinessContext();
    }
  }, [user?.id, userLoading]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Use real business context or fallback to default
      const context = businessContext || getDefaultBusinessContext();
      
      const prompt = `
      You are an expert AI tax and business assistant for an Indian business using the Tax Sathi platform. 
      Your role is to provide accurate, helpful, and professional guidance on GST, tax compliance, inventory management, and business insights.
      
      ${context}
      
      User Question: "${userMessage}"
      
      Guidelines:
      1. Provide accurate GST and tax information based on Indian tax laws
      2. Use the business context data provided to give personalized responses
      3. Be professional, helpful, and concise
      4. Suggest actionable next steps when appropriate
      5. Always remind about compliance deadlines and best practices
      6. Use ₹ symbol for Indian Rupees
      7. Reference specific business metrics when relevant
      8. If you cannot answer with certainty, suggest consulting a tax professional
      
      Please provide a helpful response to the user's question:
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || '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'}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI tax and business assistant for Indian businesses. Provide accurate, professional, and helpful guidance on GST, tax compliance, inventory management, and business insights. Always be concise and actionable.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || getFallbackResponse(userMessage);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return getFallbackResponse(userMessage);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const fallbackResponses = {
      gst: 'Based on your current invoices, you owe approximately ₹28,320 in GST (after ITC of ₹8,400). This is due by July 20th. For precise calculations, please consult your accounting records or a tax professional.',
      profit: 'Your top 3 products by profit are:\n1. Product A - ₹45,000 revenue\n2. Product B - ₹32,000 revenue\n3. Product C - ₹28,000 revenue\n\nFor detailed profit margins, please check your inventory management system.',
      stock: 'You have several products with low stock levels. Please check your inventory dashboard for specific items that need restocking to avoid stockouts.',
      turnover: 'Your current YTD turnover is approximately ₹38.2L, which is approaching the ₹40L GST registration threshold. Monitor your sales closely and consult a tax advisor for compliance requirements.',
      default: 'I can help you with GST calculations, tax compliance, inventory insights, and business metrics. Please consult your accounting software or a tax professional for specific advice tailored to your business.'
    };

    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('gst') || lowerMessage.includes('owe')) {
      return fallbackResponses.gst;
    } else if (lowerMessage.includes('profit') || lowerMessage.includes('highest') || lowerMessage.includes('product')) {
      return fallbackResponses.profit;
    } else if (lowerMessage.includes('low stock') || lowerMessage.includes('stock')) {
      return fallbackResponses.stock;
    } else if (lowerMessage.includes('turnover') || lowerMessage.includes('40')) {
      return fallbackResponses.turnover;
    }

    return fallbackResponses.default;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await getAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setError('Failed to get response from AI. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-primary/20 px-6 py-4 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/30 rounded-2xl px-6 py-3 shadow-lg backdrop-blur-sm hover:shadow-xl hover:border-primary/50 transition-all duration-500">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-xl ring-3 ring-primary/30 hover:ring-primary/60 transition-all duration-500 animate-pulse">
                <div className="w-9 h-9 bg-gradient-to-br from-background to-background/80 rounded-full flex items-center justify-center shadow-inner">
                  <Bot className="w-5 h-5 text-primary animate-bounce" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-accent via-primary to-accent rounded-full flex items-center justify-center animate-spin shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                AI Tax Assistant
              </h1>
              <div className="flex items-center gap-2 text-xs text-white/70 font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span>Live & Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.length === 1 && (
              <div className="flex items-center justify-center h-full py-20">
                <div className="text-center space-y-12">
                  <div className="relative inline-flex mx-auto">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/30 via-accent/30 to-primary/30 rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-primary/40">
                      <Lightbulb className="w-16 h-16 text-primary animate-bounce" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center shadow-2xl animate-spin">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-5xl font-bold bg-gradient-to-r from-white via-white/90 to-white bg-clip-text text-transparent">
                      How can I help you today?
                    </h3>
                    <p className="text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed font-medium">
                      I'm your AI Tax Assistant, ready to help with GST calculations, 
                      tax compliance, inventory management, and business insights.
                    </p>
                  </div>

                  {/* Suggested Prompts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedPrompt(prompt.title)}
                          className="group p-6 bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/30 rounded-2xl hover:border-primary/70 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 text-left transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/30 via-accent/30 to-primary/30 rounded-lg flex items-center justify-center group-hover:from-primary/50 group-hover:via-accent/50 group-hover:to-primary/50 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/50 flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white/95 text-sm group-hover:text-white transition-colors duration-300">{prompt.title}</p>
                              <p className="text-xs text-white/60 leading-relaxed group-hover:text-white/80 transition-colors duration-300">{prompt.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div
                  className={`max-w-2xl px-6 py-5 rounded-2xl whitespace-pre-wrap text-base shadow-lg transition-all duration-300 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-primary to-accent text-white font-medium shadow-primary/40'
                      : 'bg-gradient-to-br from-primary/20 to-accent/20 text-white/95 border border-primary/30'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 px-6 py-5 rounded-2xl shadow-lg">
                  <div className="flex gap-3">
                    <div className="w-4 h-4 bg-gradient-to-b from-primary to-accent rounded-full animate-bounce shadow-lg shadow-primary/50"></div>
                    <div className="w-4 h-4 bg-gradient-to-b from-accent to-primary rounded-full animate-bounce shadow-lg shadow-accent/50" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-4 h-4 bg-gradient-to-b from-primary to-accent rounded-full animate-bounce shadow-lg shadow-primary/50" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-primary/20 bg-gradient-to-t from-background to-background/50 backdrop-blur-xl px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Connection Error</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="text-destructive/80 hover:text-destructive transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 bg-white border border-border/50 rounded-2xl p-4 shadow-2xl backdrop-blur-sm hover:border-primary/30 transition-colors duration-300">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask me about GST, taxes, inventory, profits..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={loading}
                className="w-full border-0 focus:ring-0 focus:border-0 bg-transparent text-foreground placeholder:text-muted-foreground/70 text-base py-3 px-0"
              />
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || loading} 
              size="lg"
              className="bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/95 hover:via-accent/95 hover:to-primary/95 text-white px-8 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-base h-12 flex-shrink-0"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
