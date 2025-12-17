import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, FileText, Book, AlertCircle, Plus, Pencil, Trash2, Scale } from 'lucide-react';
import { toast } from 'sonner';
import DOJPanelCodes from '@/components/sop/DOJPanelCodes';

export default function SOP() {
  const { canEditSOP } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editCategory, setEditCategory] = useState<any>(null);
  const [editArticle, setEditArticle] = useState<any>(null);
  const [newCategory, setNewCategory] = useState(false);
  const [newArticle, setNewArticle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sop');

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

  const categoryMutation = useMutation({
    mutationFn: async ({ id, data, isNew }: { id?: string; data: any; isNew?: boolean }) => {
      if (isNew) {
        const { error } = await supabase.from('sop_categories').insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sop_categories').update(data).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-categories'] });
      toast.success('Category saved');
      setEditCategory(null);
      setNewCategory(false);
    },
    onError: () => toast.error('Failed to save category'),
  });

  const articleMutation = useMutation({
    mutationFn: async ({ id, data, isNew }: { id?: string; data: any; isNew?: boolean }) => {
      if (isNew) {
        const { error } = await supabase.from('sop_articles').insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sop_articles').update(data).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-categories'] });
      toast.success('Article saved');
      setEditArticle(null);
      setNewArticle(null);
    },
    onError: () => toast.error('Failed to save article'),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'category' | 'article'; id: string }) => {
      const table = type === 'category' ? 'sop_categories' : 'sop_articles';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-categories'] });
      toast.success('Deleted successfully');
    },
    onError: () => toast.error('Failed to delete'),
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sop" className="gap-2">
            <Book className="w-4 h-4" />
            SOP
          </TabsTrigger>
          <TabsTrigger value="doj" className="gap-2">
            <Scale className="w-4 h-4" />
            DOJ Panel Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sop" className="mt-6">
          {/* SOP Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Book className="w-8 h-8 text-primary" />
                Standard Operating Procedures
              </h1>
              <p className="text-muted-foreground mt-1">
                Department policies, procedures, and guidelines
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search SOPs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {canEditSOP && (
                <Button onClick={() => setNewCategory(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Category
                </Button>
              )}
            </div>
          </div>

          {/* SOP Content */}
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
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      {canEditSOP && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setEditCategory(category)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setNewArticle(category.id)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
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
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-foreground">
                                  {article.title}
                                </h4>
                                {canEditSOP && (
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditArticle(article)}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive"
                                      onClick={() => deleteMutation.mutate({ type: 'article', id: article.id })}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
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
                  {searchQuery ? 'Try adjusting your search terms' : 'SOP content will be added by High Command'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="doj" className="mt-6">
          <DOJPanelCodes />
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={!!editCategory || newCategory} onOpenChange={() => { setEditCategory(null); setNewCategory(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newCategory ? 'Add Category' : 'Edit Category'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const data = {
                name: (form.elements.namedItem('name') as HTMLInputElement).value,
                description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
              };
              categoryMutation.mutate({ id: editCategory?.id, data, isNew: newCategory });
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editCategory?.name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editCategory?.description || ''} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={categoryMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Article Dialog */}
      <Dialog open={!!editArticle || !!newArticle} onOpenChange={() => { setEditArticle(null); setNewArticle(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newArticle ? 'Add Article' : 'Edit Article'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const data = {
                title: (form.elements.namedItem('title') as HTMLInputElement).value,
                content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
                category_id: newArticle || editArticle?.category_id,
              };
              articleMutation.mutate({ id: editArticle?.id, data, isNew: !!newArticle });
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editArticle?.title || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" rows={8} defaultValue={editArticle?.content || ''} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={articleMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}