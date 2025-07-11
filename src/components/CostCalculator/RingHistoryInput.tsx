import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Plus, X } from "lucide-react";

interface HistoryItem {
  value: string;
  count: number;
  lastUsed: string;
}

interface RingHistoryInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  storageKey: string;
}

export const RingHistoryInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  storageKey 
}: RingHistoryInputProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, [storageKey]);

  const saveToHistory = (inputValue: string) => {
    if (!inputValue.trim()) return;

    const newHistory = [...history];
    const existingIndex = newHistory.findIndex(item => item.value === inputValue);
    
    if (existingIndex >= 0) {
      newHistory[existingIndex].count += 1;
      newHistory[existingIndex].lastUsed = new Date().toISOString();
    } else {
      newHistory.push({
        value: inputValue,
        count: 1,
        lastUsed: new Date().toISOString()
      });
    }

    // Manter apenas os 10 mais usados
    newHistory.sort((a, b) => b.count - a.count);
    const limitedHistory = newHistory.slice(0, 10);
    
    setHistory(limitedHistory);
    localStorage.setItem(storageKey, JSON.stringify(limitedHistory));
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleInputBlur = () => {
    saveToHistory(value);
  };

  const selectFromHistory = (historyValue: string) => {
    onChange(historyValue);
    setShowHistory(false);
    saveToHistory(historyValue);
  };

  const removeFromHistory = (valueToRemove: string) => {
    const newHistory = history.filter(item => item.value !== valueToRemove);
    setHistory(newHistory);
    localStorage.setItem(storageKey, JSON.stringify(newHistory));
  };

  const sortedHistory = history.sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {history.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-6 px-2 text-xs"
          >
            <History className="h-3 w-3 mr-1" />
            Histórico ({history.length})
          </Button>
        )}
      </div>
      
      <Input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleInputBlur}
        placeholder={placeholder}
      />

      {showHistory && sortedHistory.length > 0 && (
        <div className="border rounded-md p-2 bg-muted/50 space-y-1 max-h-32 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-2">Histórico de valores usados:</div>
          {sortedHistory.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 justify-start flex-1 text-xs"
                onClick={() => selectFromHistory(item.value)}
              >
                <span className="flex-1 text-left">{item.value}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.count}x
                </Badge>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-1 text-muted-foreground hover:text-destructive"
                onClick={() => removeFromHistory(item.value)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};