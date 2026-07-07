"use client";

import { useEffect, useState } from 'react';
import { Download, Table, Loader2, BarChart3, LayoutDashboard, MessageSquare, Eye, X, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface Choice {
  id: string;
  code: string;
  label: string;
  value: string;
}

interface Question {
  id: string;
  code: string;
  text: string;
  type: string;
  choices?: Choice[];
}

interface Answer {
  questionId: string;
  textValue?: string | null;
  choiceValues: string[];
  numericValue?: number | null;
}

interface Participant {
  email?: string | null;
}

interface ResponseData {
  id: string;
  submittedAt: string;
  participant?: Participant | null;
  answers: Answer[];
}

interface SurveyData {
  title: string;
  questions: Question[];
}

interface ApiResponse {
  success: boolean;
  data: {
    survey: SurveyData;
    responses: ResponseData[];
  };
  error?: string;
}

export function ResponsesViewer({ surveyId }: { surveyId: string }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'table'>('table');
  const [selectedStatId, setSelectedStatId] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchResponses() {
      try {
        const res = await fetch(`/api/surveys/${surveyId}/responses`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          const rId = searchParams.get('responseId');
          if (rId && json.data.responses) {
            const match = json.data.responses.find((r: any) => r.id === rId);
            if (match) {
              setViewMode('table');
              setSelectedResponse(match);
            }
          }
        } else {
          setError(json.error || 'Erreur lors du chargement des réponses.');
        }
      } catch (err) {
        setError('Erreur réseau.');
      } finally {
        setLoading(false);
      }
    }
    fetchResponses();
  }, [surveyId, searchParams]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="glass-card rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 text-center text-red-400">
          <p>{error || 'Aucune donnée disponible.'}</p>
        </div>
      </div>
    );
  }

  const { survey, responses } = data;

  const statQuestions = survey.questions.filter(q => ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'RATING'].includes(q.type));
  const dataQuestions = survey.questions.filter(q => q.type !== 'PRESENTATION');
  const activeStatId = selectedStatId || (statQuestions.length > 0 ? statQuestions[0].id : null);

  const filteredResponses = responses
    .filter((r: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const pEmail = r.participant?.email?.toLowerCase() || '';
      const fallbackName = (dataQuestions.length > 0 && r.answers.find((a: any) => a.questionId === dataQuestions[0].id)?.textValue?.toLowerCase()) || '';
      return pEmail.includes(q) || fallbackName.includes(q) || (q === 'anonyme' && !pEmail && !fallbackName);
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const exportCSV = () => {
    const headers = ['Date', 'Participant', ...dataQuestions.map(q => q.code)];
    const rows = responses.map(r => {
      const row = [
        `"${new Date(r.submittedAt).toLocaleString('fr-FR')}"`,
        `"${r.participant?.email || 'Anonyme'}"`,
        ...dataQuestions.map(q => {
          const ans = r.answers.find(a => a.questionId === q.id);
          if (!ans) return '""';
          if (ans.textValue) return `"${ans.textValue.replace(/"/g, '""')}"`;
          if (ans.choiceValues && ans.choiceValues.length > 0) return `"${ans.choiceValues.join(', ').replace(/"/g, '""')}"`;
          if (ans.numericValue !== null && ans.numericValue !== undefined) return ans.numericValue;
          return '""';
        })
      ];
      return row.join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reponses-${surveyId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses/${responseId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        if (data) {
          setData({
            ...data,
            responses: data.responses.filter((r: any) => r.id !== responseId)
          });
        }
      } else {
        alert(json.error || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      alert('Erreur réseau lors de la suppression.');
    }
  };

  const renderQuestionStats = (q: Question) => {
    if (!responses.length) return null;

    if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN') {
      const counts: Record<string, number> = {};
      q.choices?.forEach(c => (counts[c.value || c.code] = 0));
      
      responses.forEach(r => {
        const ans = r.answers.find(a => a.questionId === q.id);
        if (ans && ans.choiceValues) {
          ans.choiceValues.forEach(val => {
            if (counts[val] !== undefined) counts[val]++;
            else counts[val] = 1;
          });
        }
      });

      const totalAnswers = Object.values(counts).reduce((sum, count) => sum + count, 0);

      const chartData = Object.entries(counts).map(([key, count]) => {
        const choice = q.choices?.find(c => (c.value || c.code) === key);
        return { 
          name: choice?.label || key, 
          count,
          percentage: totalAnswers > 0 ? ((count / totalAnswers) * 100).toFixed(1) : '0'
        };
      }).sort((a, b) => b.count - a.count);

      const COLORS = ['#facc15', '#a8a29e', '#3f3f46', '#fbbf24', '#d6d3d1'];

      return (
        <div key={q.id} className="glass-card rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 animate-fade-in">
          <h3 className="mb-8 text-xl font-medium text-zinc-200 text-center">{q.text}</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [`${value} réponses (${props.payload.percentage}%)`, name]}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend / Stats list */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              {chartData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-300">{entry.name}</span>
                    <span className="text-xs text-zinc-500">{entry.percentage}% ({entry.count} réponses)</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 border-t border-zinc-800 pt-4">
                <span className="text-xs text-zinc-500">Total des réponses : {totalAnswers}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (q.type === 'RATING') {
      let sum = 0;
      let count = 0;
      responses.forEach(r => {
        const ans = r.answers.find(a => a.questionId === q.id);
        if (ans && ans.numericValue !== null && ans.numericValue !== undefined) {
          sum += ans.numericValue;
          count++;
        }
      });
      const avg = count > 0 ? (sum / count).toFixed(1) : 0;

      return (
        <div key={q.id} className="glass-card flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <h3 className="mb-2 text-sm font-medium text-zinc-300">{q.text}</h3>
          <p className="text-4xl font-bold text-yellow-400">{avg}</p>
          <p className="mt-1 text-xs text-zinc-500">Moyenne sur {count} réponses</p>
        </div>
      );
    }

      return null; // Don't show text answers in the stats view anymore

    return null;
  };

  return (
    <div className="flex h-full flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg bg-zinc-900/50 p-1 border border-zinc-800/80">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'overview' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Aperçu
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'table' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Table className="h-4 w-4" />
            Données brutes
          </button>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          {viewMode === 'table' && (
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Rechercher un participant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 pl-9 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-yellow-400/50 focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            </div>
          )}
          <button
            onClick={exportCSV}
            disabled={responses.length === 0}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-yellow-400/20"
          >
            <Download className="h-4 w-4" />
            Exporter en CSV
          </button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6">
          {statQuestions.length === 0 ? (
            <div className="glass-card rounded-xl border border-zinc-800 p-12 text-center text-zinc-500">
              Aucune question quantifiable n'est disponible pour les statistiques.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {statQuestions.map(q => renderQuestionStats(q))}
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="glass-card flex-1 overflow-auto rounded-xl border border-zinc-800/80 bg-zinc-900/50">
          {responses.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
              <Table className="mb-4 h-12 w-12 opacity-20" />
              <p>Aucune réponse pour le moment.</p>
            </div>
          ) : (
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="sticky top-0 bg-zinc-900/95 text-xs uppercase text-zinc-500 backdrop-blur-sm z-10">
              <tr>
                <th 
                  className="border-b border-zinc-800 px-6 py-4 font-medium cursor-pointer hover:bg-zinc-800/50 transition-colors select-none"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-medium">Participant</th>
                {dataQuestions.slice(0, 5).map(q => (
                  <th key={q.id} className="border-b border-zinc-800 px-6 py-4 font-medium" title={q.text}>
                    {q.code}
                  </th>
                ))}
                {dataQuestions.length > 5 && (
                  <th className="border-b border-zinc-800 px-6 py-4 font-medium italic text-zinc-600">...</th>
                )}
                <th className="border-b border-zinc-800 px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredResponses.map((r: any, i: number) => (
                <tr key={i} className="transition-colors hover:bg-zinc-800/20 group">
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-300">
                    {new Date(r.submittedAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-300">
                    {r.participant?.email || 
                      (dataQuestions.length > 0 && r.answers.find(a => a.questionId === dataQuestions[0].id)?.textValue) ||
                      <span className="italic text-zinc-600">Anonyme</span>}
                  </td>
                  {dataQuestions.slice(0, 5).map(q => {
                    const ans = r.answers.find(a => a.questionId === q.id);
                    return (
                      <td key={q.id} className="px-6 py-4 text-zinc-300 max-w-[200px] truncate" title={ans?.textValue || ans?.choiceValues?.join(', ') || ''}>
                        {!ans ? (
                          <span className="text-zinc-600">-</span>
                        ) : (
                          <span>
                            {ans.textValue || 
                             (ans.choiceValues?.length ? ans.choiceValues.join(', ') : 
                             (ans.numericValue !== null && ans.numericValue !== undefined ? ans.numericValue : <span className="text-zinc-600">-</span>))}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {dataQuestions.length > 5 && (
                    <td className="px-6 py-4 text-zinc-600">...</td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedResponse(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                        title="Voir tout"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </button>
                      <button 
                        onClick={() => handleDeleteResponse(r.id)}
                        className="inline-flex items-center p-1.5 rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Supprimer la réponse"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Détails de la réponse</h3>
                <p className="text-sm text-zinc-500">
                  Soumis le {new Date(selectedResponse.submittedAt).toLocaleString('fr-FR')}
                  {' '}par{' '}
                  <span className="text-zinc-300 font-medium">
                    {selectedResponse.participant?.email || 
                      (dataQuestions.length > 0 && selectedResponse.answers.find((a: any) => a.questionId === dataQuestions[0].id)?.textValue) ||
                      'Anonyme'}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedResponse(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {dataQuestions.map(q => {
                const ans = selectedResponse.answers.find((a: any) => a.questionId === q.id);
                return (
                  <div key={q.id} className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-5">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-zinc-800 text-xs font-bold text-yellow-400">
                        {q.code}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-300 mb-3">{q.text}</p>
                        <div className="text-zinc-100">
                          {!ans ? (
                            <span className="text-zinc-600 italic text-sm">Non répondu</span>
                          ) : ans.textValue ? (
                            <p className="text-sm whitespace-pre-wrap">{ans.textValue}</p>
                          ) : ans.choiceValues?.length ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {ans.choiceValues.map((v: string, idx: number) => {
                                const choiceLabel = q.choices?.find(c => (c.value || c.code) === v)?.label || v;
                                return <li key={idx} className="text-sm">{choiceLabel}</li>;
                              })}
                            </ul>
                          ) : ans.numericValue !== null && ans.numericValue !== undefined ? (
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm font-bold">
                              {ans.numericValue} / 10
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic text-sm">Non répondu</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
