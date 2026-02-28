import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

export function LanguageSelector() {
  const {
    language,
    languageName,
    t,
    setLanguage,
    translateWithAI,
    isTranslating,
    availableLanguages,
    aiLanguages,
  } = useLanguage();

  const [aiTargetLang, setAiTargetLang] = useState('ta');
  const [translateError, setTranslateError] = useState('');
  const [translateSuccess, setTranslateSuccess] = useState(false);

  const handleBuiltInLanguageChange = (value: string) => {
    setLanguage(value);
    setTranslateSuccess(false);
    setTranslateError('');
  };

  const handleAITranslate = async () => {
    setTranslateError('');
    setTranslateSuccess(false);
    try {
      await translateWithAI(aiTargetLang);
      setTranslateSuccess(true);
      setTimeout(() => setTranslateSuccess(false), 3000);
    } catch {
      setTranslateError('Translation failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t.settings.languageSettings}
          </CardTitle>
          <CardDescription>{t.settings.languageSettingsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t.settings.currentLanguage}:</span>
            <span className="font-medium text-foreground">{languageName}</span>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t.settings.selectLanguage}</label>
            <Select value={language === 'custom' ? 'custom' : language} onValueChange={handleBuiltInLanguageChange}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      <span className="text-muted-foreground">({lang.nativeName})</span>
                    </span>
                  </SelectItem>
                ))}
                {language === 'custom' && (
                  <SelectItem value="custom">
                    <span className="flex items-center gap-2">
                      <span>🤖</span>
                      <span>AI Translated</span>
                      <span className="text-muted-foreground">({languageName})</span>
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Translation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t.settings.translateWithAI}
          </CardTitle>
          <CardDescription>{t.settings.aiTranslateDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {translateSuccess && (
            <Alert className="border-success bg-success/5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>Translation completed successfully!</AlertDescription>
            </Alert>
          )}

          {translateError && (
            <Alert variant="destructive">
              <AlertDescription>{translateError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t.settings.targetLanguage}</label>
              <Select value={aiTargetLang} onValueChange={setAiTargetLang}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.name}</span>
                        <span className="text-muted-foreground">({lang.nativeName})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAITranslate}
                disabled={isTranslating}
                className="w-full sm:w-auto"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.settings.translatingAI}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t.settings.translateButton}
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            AI translation uses Groq to translate all interface text. Results are cached locally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
