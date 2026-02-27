import { useState } from 'react';
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

export default function Chatbot() {
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

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Mock business data for context
      const businessContext = `
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
      
      const prompt = `
      You are an expert AI tax and business assistant for an Indian business using the Tax Saathi platform. 
      Your role is to provide accurate, helpful, and professional guidance on GST, tax compliance, inventory management, and business insights.
      
      ${businessContext}
      
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
    <div className="p-4 md:p-8 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-4 bg-white border border-border/50 rounded-2xl px-8 py-4 shadow-lg backdrop-blur-sm">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-2xl ring-4 ring-primary/20">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                <Bot className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Tax Assistant
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live & Ready</span>
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <div className="flex-1 bg-white border border-border/50 rounded-3xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-white to-muted/20">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-base font-semibold text-foreground">Live Chat</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="bg-green-500/20 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>
              <span>Secure</span>
              <span>•</span>
              <span>Encrypted</span>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex-1 overflow-y-auto space-y-8 max-h-[65vh]">
              {messages.length === 1 && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-10">
                    <div className="relative inline-flex mx-auto">
                      <div className="w-28 h-28 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-full flex items-center justify-center animate-pulse shadow-xl">
                        <Lightbulb className="w-14 h-14 text-primary" />
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center shadow-2xl">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-4xl font-bold text-foreground">
                        How can I help you today?
                      </h3>
                      <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        I'm your AI Tax Assistant, ready to help with GST calculations, 
                        tax compliance, inventory management, and business insights.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-xl px-8 py-6 rounded-3xl whitespace-pre-wrap text-base shadow-xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-primary to-accent text-white'
                        : 'bg-gradient-to-r from-white to-muted/50 text-foreground border border-border/50'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-white to-muted/50 border border-border/50 px-8 py-6 rounded-3xl shadow-xl">
                    <div className="flex gap-4">
                      <div className="w-5 h-5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-5 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-5 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Prompts - Show only when no message exchange */}
        {messages.length === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-base font-medium text-muted-foreground">Popular Questions</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SUGGESTED_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt.title)}
                    className="group p-8 bg-white border border-border/50 rounded-3xl hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 text-left transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl flex items-center justify-center group-hover:from-primary/20 group-hover:via-accent/20 group-hover:to-primary/20 transition-all duration-300">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-xl mb-3">{prompt.title}</p>
                        <p className="text-base text-muted-foreground leading-relaxed">{prompt.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-4">
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
        
        

        <div className="flex gap-6 bg-white border border-border/50 rounded-3xl p-4 shadow-xl backdrop-blur-sm">
          <div className="flex-1 relative">
            <Input
              placeholder="Type your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
              className="w-full border-0 focus:ring-0 focus:border-0 bg-transparent text-foreground placeholder:text-muted-foreground text-lg py-6 px-6"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Enter</span>
              <span className="text-border">•</span>
              <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">Send</span>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || loading} 
            size="lg"
            className="bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/95 hover:via-accent/95 hover:to-primary/95 text-white px-10 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 active:-translate-y-1 text-lg font-semibold h-16"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-lg">Thinking...</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Send className="w-6 h-6" />
                <span className="text-lg font-bold">Send Message</span>
              </div>
            )}
          </Button>
        </div>
        
       
      </div>
    </div>
  );
}
