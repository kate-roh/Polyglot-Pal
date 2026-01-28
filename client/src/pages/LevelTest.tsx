import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, Trophy, Target, BookOpen, MessageSquare, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { DESTINATIONS } from '@/lib/constants';

interface TestQuestion {
  id: number;
  type: 'vocabulary' | 'grammar' | 'reading' | 'situational';
  difficulty: string;
  question: string;
  questionKo: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  skillTested: string;
}

interface TestResult {
  cefrLevel: string;
  cefrScore: number;
  correctCount: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  previousLevel: string | null;
  levelChanged: boolean;
}

const CEFR_DESCRIPTIONS: Record<string, { label: string; description: string; color: string }> = {
  'A1': { label: '입문', description: '기초적인 일상 표현을 이해하고 사용할 수 있음', color: 'from-green-500 to-emerald-600' },
  'A2': { label: '초급', description: '일상적인 상황에서 간단한 의사소통이 가능함', color: 'from-teal-500 to-cyan-600' },
  'B1': { label: '중급', description: '일상적인 주제에 대해 의견을 표현할 수 있음', color: 'from-blue-500 to-indigo-600' },
  'B2': { label: '중상급', description: '복잡한 텍스트의 주요 내용을 이해하고 토론 가능', color: 'from-purple-500 to-violet-600' },
  'C1': { label: '고급', description: '다양한 상황에서 유창하게 의사소통이 가능함', color: 'from-pink-500 to-rose-600' },
  'C2': { label: '최고급', description: '원어민 수준으로 모든 상황에서 자유롭게 표현', color: 'from-amber-500 to-orange-600' }
};

const availableLanguages = Array.from(
  new Map(DESTINATIONS.map(d => [d.language.code, { code: d.language.code, name: d.language.name, flag: d.language.flag }])).values()
);

export default function LevelTest() {
  const [selectedLanguage, setSelectedLanguage] = useState<typeof availableLanguages[0] | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const startTest = async (language: typeof availableLanguages[0]) => {
    setSelectedLanguage(language);
    setIsLoading(true);
    setResult(null);
    setAnswers([]);
    setCurrentQuestionIndex(0);

    try {
      const response = await apiRequest('POST', '/api/level-test/generate', {
        languageCode: language.code,
        languageName: language.name
      });
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to generate test:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitTest = async () => {
    if (!selectedLanguage) return;
    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/level-test/submit', {
        languageCode: selectedLanguage.code,
        languageName: selectedLanguage.name,
        answers,
        questions,
        testType: 'initial'
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to submit test:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTest = () => {
    setSelectedLanguage(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResult(null);
    setShowExplanation(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vocabulary': return <BookOpen className="w-4 h-4" />;
      case 'grammar': return <Brain className="w-4 h-4" />;
      case 'reading': return <Target className="w-4 h-4" />;
      case 'situational': return <MessageSquare className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (result) {
    const levelInfo = CEFR_DESCRIPTIONS[result.cefrLevel] || CEFR_DESCRIPTIONS['A1'];
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`w-28 h-28 bg-gradient-to-br ${levelInfo.color} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                <div className="text-center text-white">
                  <div className="text-3xl font-black">{result.cefrLevel}</div>
                  <div className="text-xs">{levelInfo.label}</div>
                </div>
              </motion.div>

              <h2 className="text-2xl font-black mb-2">레벨 테스트 완료!</h2>
              <p className="text-muted-foreground mb-4">
                {selectedLanguage?.flag} {selectedLanguage?.name}
              </p>

              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground mb-2">{levelInfo.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">정답률</span>
                  <span className="font-bold text-primary">
                    {result.correctCount}/{result.totalQuestions} ({Math.round(result.correctCount / result.totalQuestions * 100)}%)
                  </span>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div className="mb-4 text-left">
                  <h4 className="text-sm font-bold text-green-500 mb-2">강점</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.strengths.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.weaknesses.length > 0 && (
                <div className="mb-6 text-left">
                  <h4 className="text-sm font-bold text-amber-500 mb-2">보완 필요</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.weaknesses.map((w, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetTest} className="flex-1" data-testid="button-back-to-languages">
                  다른 언어 테스트
                </Button>
                <Button onClick={resetTest} className="flex-1" data-testid="button-test-again">
                  다시 테스트
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">테스트 문제를 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (questions.length > 0 && selectedLanguage) {
    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = answers[currentQuestionIndex] !== undefined;
    const isCorrect = isAnswered && answers[currentQuestionIndex] === currentQuestion.correctAnswer;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const allAnswered = questions.length > 0 && 
      questions.every((_, idx) => answers[idx] !== undefined && answers[idx] !== null);

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={resetTest} data-testid="button-exit-test">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedLanguage.flag}</span>
              <span className="font-bold">{selectedLanguage.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>

          <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    currentQuestion.difficulty === 'A1' || currentQuestion.difficulty === 'A2' ? 'bg-green-500/10 text-green-500' :
                    currentQuestion.difficulty === 'B1' || currentQuestion.difficulty === 'B2' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-purple-500/10 text-purple-500'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTypeIcon(currentQuestion.type)}
                    {currentQuestion.type}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-6">{currentQuestion.question}</h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = answers[currentQuestionIndex] === idx;
                    const isCorrectOption = idx === currentQuestion.correctAnswer;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => !isAnswered && selectAnswer(idx)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          !isAnswered 
                            ? 'bg-muted hover:bg-muted/80 hover-elevate' 
                            : isCorrectOption
                              ? 'bg-green-500/20 border-2 border-green-500'
                              : isSelected
                                ? 'bg-red-500/20 border-2 border-red-500'
                                : 'bg-muted opacity-50'
                        }`}
                        data-testid={`button-option-${idx}`}
                      >
                        <span className="font-medium">{option}</span>
                        {isAnswered && isCorrectOption && (
                          <Check className="inline-block ml-2 w-4 h-4 text-green-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-green-500/10' : 'bg-amber-500/10'}`}
                  >
                    <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-500' : 'text-amber-500'}`}>
                      {isCorrect ? '정답입니다!' : '오답입니다'}
                    </p>
                    <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex-1"
              data-testid="button-prev-question"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={submitTest}
                disabled={!allAnswered || isSubmitting}
                className="flex-1"
                data-testid="button-submit-test"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trophy className="w-4 h-4 mr-2" />
                )}
                결과 보기
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={!isAnswered}
                className="flex-1"
                data-testid="button-next-question"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">CEFR 레벨 테스트</h1>
          <p className="text-muted-foreground">
            언어를 선택하고 실력을 측정해보세요
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {Object.entries(CEFR_DESCRIPTIONS).map(([level, info]) => (
            <div key={level} className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${info.color} text-white`}>
                  {level}
                </span>
                <span className="text-sm font-medium">{info.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold mb-4">언어 선택</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableLanguages.map((lang) => (
            <Card
              key={lang.code}
              className="p-4 cursor-pointer hover-elevate transition-all"
              onClick={() => startTest(lang)}
              data-testid={`button-select-language-${lang.code}`}
            >
              <div className="text-center">
                <span className="text-3xl mb-2 block">{lang.flag}</span>
                <span className="font-medium text-sm">{lang.name}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
