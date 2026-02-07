import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Building2, Users, Plus, X, Loader2, Pencil, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  pm_name: string | null;
  domain_id: string;
}

interface Domain {
  id: string;
  name: string;
  product_area_id: string;
  teams: Team[];
}

interface ProductArea {
  id: string;
  name: string;
  domains: Domain[];
}

export function OrganizationStructure() {
  const { organization, isAdmin, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [productAreas, setProductAreas] = useState<ProductArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: string; id: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchStructure = async () => {
    if (!organization?.id) return;

    try {
      const { data: paData, error: paError } = await supabase
        .from('product_areas')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      if (paError) throw paError;

      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('*')
        .in('product_area_id', paData.map((pa) => pa.id))
        .order('name');

      if (domainError) throw domainError;

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .in('domain_id', domainData.map((d) => d.id))
        .order('name');

      if (teamError) throw teamError;

      // Build hierarchy
      const structure: ProductArea[] = paData.map((pa) => ({
        ...pa,
        domains: domainData
          .filter((d) => d.product_area_id === pa.id)
          .map((d) => ({
            ...d,
            teams: teamData.filter((t) => t.domain_id === d.id),
          })),
      }));

      setProductAreas(structure);
    } catch (error) {
      console.error('Error fetching structure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStructure();
  }, [organization?.id]);

  const startEdit = (type: string, id: string, currentValue: string) => {
    setEditingItem({ type, id });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingItem || !editValue.trim()) return;

    try {
      const { type, id } = editingItem;
      let error;

      if (type === 'productArea') {
        ({ error } = await supabase
          .from('product_areas')
          .update({ name: editValue })
          .eq('id', id));
      } else if (type === 'domain') {
        ({ error } = await supabase
          .from('domains')
          .update({ name: editValue })
          .eq('id', id));
      } else if (type === 'team') {
        ({ error } = await supabase
          .from('teams')
          .update({ name: editValue })
          .eq('id', id));
      }

      if (error) throw error;

      await fetchStructure();
      cancelEdit();
      toast({ title: 'Updated', description: 'Structure updated successfully.' });
    } catch (error) {
      console.error('Error updating:', error);
      toast({ title: 'Error', description: 'Failed to update.', variant: 'destructive' });
    }
  };

  const addProductArea = async () => {
    if (!organization?.id) return;

    try {
      const { error } = await supabase
        .from('product_areas')
        .insert({ name: 'New Product Area', organization_id: organization.id });

      if (error) throw error;
      await fetchStructure();
    } catch (error) {
      console.error('Error adding product area:', error);
      toast({ title: 'Error', description: 'Failed to add product area.', variant: 'destructive' });
    }
  };

  const addDomain = async (productAreaId: string) => {
    try {
      const { error } = await supabase
        .from('domains')
        .insert({ name: 'New Domain', product_area_id: productAreaId });

      if (error) throw error;
      await fetchStructure();
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({ title: 'Error', description: 'Failed to add domain.', variant: 'destructive' });
    }
  };

  const addTeam = async (domainId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .insert({ name: 'New Team', domain_id: domainId });

      if (error) throw error;
      await fetchStructure();
    } catch (error) {
      console.error('Error adding team:', error);
      toast({ title: 'Error', description: 'Failed to add team.', variant: 'destructive' });
    }
  };

  const deleteItem = async (type: string, id: string) => {
    try {
      let error;

      if (type === 'productArea') {
        ({ error } = await supabase.from('product_areas').delete().eq('id', id));
      } else if (type === 'domain') {
        ({ error } = await supabase.from('domains').delete().eq('id', id));
      } else if (type === 'team') {
        ({ error } = await supabase.from('teams').delete().eq('id', id));
      }

      if (error) throw error;
      await fetchStructure();
      toast({ title: 'Deleted', description: 'Item removed successfully.' });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Organization Structure</CardTitle>
            <CardDescription className="text-sm mt-1">
              {isAdmin
                ? 'Product areas, domains, and teams define how OKRs roll up in TrueNorth. Teams create OKRs within this structure.'
                : 'Product areas, domains, and teams define how OKRs roll up. This structure is managed by Product Ops or leadership.'}
            </CardDescription>
          </div>
          {isAdmin && (
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Done' : 'Manage structure'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {productAreas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No structure defined yet.</p>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={addProductArea} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add product area
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {productAreas.map((pa) => (
              <div key={pa.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  {editingItem?.type === 'productArea' && editingItem.id === pa.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{pa.name}</span>
                      {isAdmin && isEditing && (
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit('productArea', pa.id, pa.name)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteItem('productArea', pa.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="ml-6 space-y-3">
                  {pa.domains.map((domain) => (
                    <div key={domain.id} className="border-l-2 border-border pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {editingItem?.type === 'domain' && editingItem.id === domain.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={saveEdit}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={cancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{domain.name}</span>
                            {isAdmin && isEditing && (
                              <div className="ml-auto flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => startEdit('domain', domain.id, domain.name)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => deleteItem('domain', domain.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="ml-4 space-y-1">
                        {domain.teams.map((team) => (
                          <div key={team.id} className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {editingItem?.type === 'team' && editingItem.id === team.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-xs"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={saveEdit}>
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm text-muted-foreground">{team.name}</span>
                                {team.pm_name && (
                                  <span className="text-xs text-muted-foreground/60">
                                    · {team.pm_name}
                                  </span>
                                )}
                                {isAdmin && isEditing && (
                                  <div className="ml-auto flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5"
                                      onClick={() => startEdit('team', team.id, team.name)}
                                    >
                                      <Pencil className="w-2.5 h-2.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5"
                                      onClick={() => deleteItem('team', team.id)}
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                        {isAdmin && isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => addTeam(domain.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add team
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAdmin && isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => addDomain(pa.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add domain
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isAdmin && isEditing && (
              <Button variant="outline" size="sm" onClick={addProductArea}>
                <Plus className="w-4 h-4 mr-2" />
                Add product area
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
