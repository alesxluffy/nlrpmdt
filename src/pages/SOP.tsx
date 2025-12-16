import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, FileText, Book, AlertCircle } from 'lucide-react';

export default function SOP() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['sop-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sop_categories')
        .select(`
          *,
          sop_articles (*)
        `)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });

  const filteredCategories = categories?.map(category => ({
    ...category,
    sop_articles: category.sop_articles?.filter((article: any) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.sop_articles && category.sop_articles.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Book className="w-8 h-8 text-primary" />
            Standard Operating Procedures
          </h1>
          <p className="text-muted-foreground mt-1">
            Department policies, procedures, and guidelines
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search SOPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-card">
              <CardHeader>
                <div className="h-6 bg-secondary rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-secondary rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCategories && filteredCategories.length > 0 ? (
        <Accordion type="multiple" className="space-y-4">
          {filteredCategories.map((category) => (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                {category.sop_articles && category.sop_articles.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {category.sop_articles
                      .sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((article: any) => (
                        <div
                          key={article.id}
                          className="p-4 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <h4 className="font-medium text-foreground mb-2">
                            {article.title}
                          </h4>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {article.content}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No articles in this category yet</p>
                    <p className="text-xs">Content will be added soon</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No results found' : 'No SOPs available'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'SOP content will be added by administrators'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
