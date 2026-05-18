import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Paperclip,
  Smile,
  Search,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';

interface Chat {
  id: number;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  role: string;
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  time: string;
  type: 'text' | 'image' | 'file';
  fileName?: string;
}

const chats: Chat[] = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    initials: 'SJ',
    lastMessage: 'Your appointment is confirmed for tomorrow at 10 AM',
    time: '2m ago',
    unread: 2,
    online: true,
    role: 'Doctor',
  },
  {
    id: 2,
    name: 'Michael Chen',
    initials: 'MC',
    lastMessage: 'Thank you for the treatment!',
    time: '1h ago',
    unread: 0,
    online: false,
    role: 'Patient',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    initials: 'ER',
    lastMessage: 'Can we reschedule the appointment?',
    time: '3h ago',
    unread: 1,
    online: true,
    role: 'Patient',
  },
  {
    id: 4,
    name: 'David Park',
    initials: 'DP',
    lastMessage: 'The X-ray results are ready',
    time: '1d ago',
    unread: 0,
    online: false,
    role: 'Doctor',
  },
  {
    id: 5,
    name: 'DentyHub Support',
    initials: 'DS',
    lastMessage: 'How can we help you today?',
    time: '2d ago',
    unread: 0,
    online: true,
    role: 'Support',
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    senderId: 1,
    text: 'Hello! I hope you\'re doing well. I wanted to confirm your appointment for tomorrow.',
    time: '10:30 AM',
    type: 'text',
  },
  {
    id: 2,
    senderId: 0,
    text: 'Hi Dr. Johnson! Yes, I\'ll be there at 10 AM.',
    time: '10:32 AM',
    type: 'text',
  },
  {
    id: 3,
    senderId: 1,
    text: 'Perfect! Please bring your insurance card and arrive 10 minutes early for check-in.',
    time: '10:33 AM',
    type: 'text',
  },
  {
    id: 4,
    senderId: 0,
    text: 'Will do. Should I continue my current medication?',
    time: '10:35 AM',
    type: 'text',
  },
  {
    id: 5,
    senderId: 1,
    text: 'Yes, please continue taking it as prescribed. We\'ll review everything during your visit.',
    time: '10:36 AM',
    type: 'text',
  },
  {
    id: 6,
    senderId: 0,
    text: 'Great, thank you!',
    time: '10:37 AM',
    type: 'text',
  },
  {
    id: 7,
    senderId: 1,
    text: 'Your appointment is confirmed for tomorrow at 10 AM',
    time: '10:38 AM',
    type: 'text',
  },
];

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<Chat>(chats[0]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      senderId: 0,
      text: messageInput,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'text',
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with your patients and healthcare team
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden h-[calc(100vh-16rem)]">
          <div className="grid grid-cols-12 h-full">
            {/* Chat List */}
            <div className="col-span-12 md:col-span-4 border-r border-border flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Chats */}
              <ScrollArea className="flex-1">
                <div className="divide-y divide-border">
                  {filteredChats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      whileHover={{ backgroundColor: 'rgb(244, 245, 247)' }}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-4 text-left transition-colors ${
                        selectedChat.id === chat.id ? 'bg-secondary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 bg-primary">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {chat.initials}
                            </AvatarFallback>
                          </Avatar>
                          {chat.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-semibold text-foreground truncate">
                                {chat.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {chat.role}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">
                                {chat.time}
                              </p>
                              {chat.unread > 0 && (
                                <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                                  {chat.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Window */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-11 h-11 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {selectedChat.initials}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChat.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedChat.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.online ? 'Online' : 'Offline'} • {selectedChat.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === 0;
                    const showTime =
                      index === 0 ||
                      messages[index - 1].time !== message.time;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwn ? 'items-end' : 'items-start'
                          }`}
                        >
                          {showTime && (
                            <p className="text-xs text-muted-foreground mb-2 px-2">
                              {message.time}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-secondary text-foreground rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">
                              {message.text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-10 min-h-[44px]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-primary hover:bg-primary-hover flex-shrink-0"
                    size="icon"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 px-2">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
