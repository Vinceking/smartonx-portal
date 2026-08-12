import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminOnboard, usePlacesAutocomplete, usePlacesDetails } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ChevronRight, ArrowLeft, Building2, CreditCard, MapPin, User, Rocket, Copy, Check, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simplified state management for the wizard
const DRAFT_KEY = 'admin_onboard_draft';

const defaultDraft = {
  orgName: '',
  orgType: 'dental_practice',
  billingName: 'Primary Billing',
  billingAddress1: '',
  billingAddress2: '',
  billingCity: '',
  billingState: '',
  billingZip: '',
  billingApEmail: '',
  billingApPhone: '',
  billingPaymentTerms: 'credit_card',
  billingNetDays: 30,
  billingPlaceId: '',
  
  locationNickname: 'Main Office',
  locationAddress1: '',
  locationAddress2: '',
  locationCity: '',
  locationState: '',
  locationZip: '',
  locationPhone: '',
  locationPlaceId: '',
  
  contactFirst: '',
  contactLast: '',
  contactRoleTitle: 'Owner',
  contactEmail: '',
  username: '',
};

export default function AdminOnboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const onboardMutation = useAdminOnboard();
  
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(defaultDraft);
  const [result, setResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDraft(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (step > 1 && !result) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [draft, step, result]);

  const updateDraft = (key: string, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const generateUsername = () => {
    if (!draft.contactFirst || !draft.contactLast) return;
    const base = `${draft.contactFirst[0]}${draft.contactLast}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    updateDraft('username', base);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) return !!draft.orgName && !!draft.orgType;
    if (currentStep === 2) return !!draft.billingName && !!draft.billingAddress1 && !!draft.billingCity && !!draft.billingState && !!draft.billingZip && !!draft.billingApEmail;
    if (currentStep === 3) return !!draft.locationNickname && !!draft.locationAddress1 && !!draft.locationCity && !!draft.locationState && !!draft.locationZip;
    if (currentStep === 4) return !!draft.contactFirst && !!draft.contactLast && !!draft.contactEmail && !!draft.username;
    return true;
  };

  const handleSubmit = async () => {
    try {
      const res = await onboardMutation.mutateAsync({
        data: {
          orgName: draft.orgName,
          orgType: draft.orgType,
          billingName: draft.billingName,
          billingAddress1: draft.billingAddress1,
          billingAddress2: draft.billingAddress2 || undefined,
          billingCity: draft.billingCity,
          billingState: draft.billingState,
          billingZip: draft.billingZip,
          billingApEmail: draft.billingApEmail,
          billingApPhone: draft.billingApPhone || undefined,
          billingPaymentTerms: draft.billingPaymentTerms,
          billingNetDays: draft.billingPaymentTerms === 'net_terms' ? Number(draft.billingNetDays) : undefined,
          billingPlaceId: draft.billingPlaceId || undefined,
          
          locationNickname: draft.locationNickname,
          locationAddress1: draft.locationAddress1,
          locationAddress2: draft.locationAddress2 || undefined,
          locationCity: draft.locationCity,
          locationState: draft.locationState,
          locationZip: draft.locationZip,
          locationPhone: draft.locationPhone || undefined,
          locationPlaceId: draft.locationPlaceId || undefined,
          
          contactFirst: draft.contactFirst,
          contactLast: draft.contactLast,
          contactRoleTitle: draft.contactRoleTitle,
          contactEmail: draft.contactEmail,
          username: draft.username,
        }
      });
      
      setResult(res);
      localStorage.removeItem(DRAFT_KEY);
      setStep(6); // Success screen
    } catch (err: any) {
      toast({
        title: 'Onboarding Failed',
        description: err.error || 'Check all fields and try again.',
        variant: 'destructive',
      });
    }
  };

  const steps = [
    { num: 1, title: 'Organization', icon: Building2 },
    { num: 2, title: 'Billing', icon: CreditCard },
    { num: 3, title: 'Location', icon: MapPin },
    { num: 4, title: 'Admin User', icon: User },
    { num: 5, title: 'Review', icon: Rocket },
  ];

  if (step === 6 && result) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-green-200 border-2 shadow-lg overflow-hidden">
          <div className="bg-green-50 p-8 text-center border-b border-green-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900">Onboarding Complete!</h2>
            <p className="text-green-700 mt-2">The organization, location, and user account have been created.</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">CRM Records Created</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500 block">HubSpot Company ID</span><span className="font-mono">{result.companyId}</span></div>
                <div><span className="text-gray-500 block">HubSpot Contact ID</span><span className="font-mono">{result.contactId}</span></div>
                <div><span className="text-gray-500 block">HubSpot Location ID</span><span className="font-mono">{result.locationId}</span></div>
                <div><span className="text-gray-500 block">HubSpot Billing Profile ID</span><span className="font-mono">{result.billingProfileId}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Portal Credentials</h3>
              <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Portal Login URL</span>
                    <div className="font-medium text-primary mt-1">https://smartonx.com/login</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Username</span>
                    <div className="font-mono font-medium text-lg mt-1">{result.username}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.username, 'username')}>
                    {copiedKey === 'username' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />} Copy
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Temporary Password</span>
                    <div className="font-mono font-medium text-lg mt-1 bg-white px-2 py-1 rounded border inline-block">{result.tempPassword}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.tempPassword, 'password')}>
                    {copiedKey === 'password' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />} Copy
                  </Button>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  The user will be required to change this password upon their first login.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-6 flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/organizations">View Organizations</Link>
            </Button>
            <Button onClick={() => { setStep(1); setDraft(defaultDraft); setResult(null); }}>
              Onboard Another
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Onboard Customer</h1>
        <p className="text-gray-500 mt-1">Create a new organization, location, and user account all at once.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-1 bg-gray-200 -z-10 rounded-full"></div>
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300" 
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        ></div>
        
        {steps.map((s) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          const Icon = s.icon;
          return (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-gray-50 relative z-10 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors border-2 ${
                isActive ? 'bg-primary text-white border-primary' : 
                isCompleted ? 'bg-white text-primary border-primary' : 'bg-white text-gray-400 border-gray-300'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${isActive || isCompleted ? 'text-primary' : 'text-gray-500'}`}>{s.title}</span>
            </div>
          );
        })}
      </div>

      <Card className="border-gray-200 shadow-sm min-h-[400px] flex flex-col">
        <CardHeader className="bg-gray-50/80 border-b flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl flex items-center gap-2">
            {steps[step-1].title}
          </CardTitle>
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={prevStep} className="text-gray-500">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-6">
          {/* STEP 1: Org */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="orgName" 
                  value={draft.orgName} 
                  onChange={e => updateDraft('orgName', e.target.value)} 
                  placeholder="e.g. Apex Dental Group"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Organization Type <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  value={draft.orgType} 
                  onValueChange={v => updateDraft('orgType', v)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors bg-white">
                    <RadioGroupItem value="dental_practice" id="type-practice" />
                    <Label htmlFor="type-practice" className="cursor-pointer font-medium">Practice</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors bg-white">
                    <RadioGroupItem value="lab" id="type-lab" />
                    <Label htmlFor="type-lab" className="cursor-pointer font-medium">Dental Lab</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors bg-white">
                    <RadioGroupItem value="dso" id="type-dso" />
                    <Label htmlFor="type-dso" className="cursor-pointer font-medium">DSO</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* STEP 2: Billing */}
          {step === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Billing Profile Name <span className="text-red-500">*</span></Label>
                  <Input value={draft.billingName} onChange={e => updateDraft('billingName', e.target.value)} />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address Line 1 <span className="text-red-500">*</span></Label>
                  <Input value={draft.billingAddress1} onChange={e => updateDraft('billingAddress1', e.target.value)} />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address Line 2</Label>
                  <Input value={draft.billingAddress2} onChange={e => updateDraft('billingAddress2', e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input value={draft.billingCity} onChange={e => updateDraft('billingCity', e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Input value={draft.billingState} onChange={e => updateDraft('billingState', e.target.value)} maxLength={2} placeholder="NY" />
                </div>
                
                <div className="space-y-2">
                  <Label>ZIP Code <span className="text-red-500">*</span></Label>
                  <Input value={draft.billingZip} onChange={e => updateDraft('billingZip', e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-6 grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>A/P Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={draft.billingApEmail} onChange={e => updateDraft('billingApEmail', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>A/P Phone</Label>
                  <Input value={draft.billingApPhone} onChange={e => updateDraft('billingApPhone', e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label>Payment Terms <span className="text-red-500">*</span></Label>
                <div className="flex gap-4">
                  <div 
                    className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${draft.billingPaymentTerms === 'credit_card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-gray-400 bg-white'}`}
                    onClick={() => updateDraft('billingPaymentTerms', 'credit_card')}
                  >
                    <div className="font-semibold text-primary">Credit Card</div>
                    <div className="text-sm text-gray-500 mt-1">Paid at checkout</div>
                  </div>
                  <div 
                    className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${draft.billingPaymentTerms === 'net_terms' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-gray-400 bg-white'}`}
                    onClick={() => updateDraft('billingPaymentTerms', 'net_terms')}
                  >
                    <div className="font-semibold text-primary">Net Terms</div>
                    <div className="text-sm text-gray-500 mt-1">Invoiced on shipment</div>
                  </div>
                </div>
                
                {draft.billingPaymentTerms === 'net_terms' && (
                  <div className="mt-4 p-4 bg-gray-50 border rounded-lg flex items-center gap-4">
                    <Label className="whitespace-nowrap">Net Days:</Label>
                    <Select value={String(draft.billingNetDays)} onValueChange={v => updateDraft('billingNetDays', Number(v))}>
                      <SelectTrigger className="w-[120px] bg-white"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Net 15</SelectItem>
                        <SelectItem value="30">Net 30</SelectItem>
                        <SelectItem value="45">Net 45</SelectItem>
                        <SelectItem value="60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Location */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="flex justify-end mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    updateDraft('locationAddress1', draft.billingAddress1);
                    updateDraft('locationAddress2', draft.billingAddress2);
                    updateDraft('locationCity', draft.billingCity);
                    updateDraft('locationState', draft.billingState);
                    updateDraft('locationZip', draft.billingZip);
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" /> Same as Billing Address
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Location Nickname <span className="text-red-500">*</span></Label>
                  <Input value={draft.locationNickname} onChange={e => updateDraft('locationNickname', e.target.value)} />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address Line 1 <span className="text-red-500">*</span></Label>
                  <Input value={draft.locationAddress1} onChange={e => updateDraft('locationAddress1', e.target.value)} />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address Line 2</Label>
                  <Input value={draft.locationAddress2} onChange={e => updateDraft('locationAddress2', e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input value={draft.locationCity} onChange={e => updateDraft('locationCity', e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Input value={draft.locationState} onChange={e => updateDraft('locationState', e.target.value)} maxLength={2} />
                </div>
                
                <div className="space-y-2">
                  <Label>ZIP Code <span className="text-red-500">*</span></Label>
                  <Input value={draft.locationZip} onChange={e => updateDraft('locationZip', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Location Phone</Label>
                  <Input value={draft.locationPhone} onChange={e => updateDraft('locationPhone', e.target.value)} />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                <p>This location will automatically be linked to the billing profile created in the previous step and set as the default location.</p>
              </div>
            </div>
          )}

          {/* STEP 4: User */}
          {step === 4 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={draft.contactFirst} 
                    onChange={e => updateDraft('contactFirst', e.target.value)} 
                    onBlur={generateUsername}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={draft.contactLast} 
                    onChange={e => updateDraft('contactLast', e.target.value)} 
                    onBlur={generateUsername}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input value={draft.contactRoleTitle} onChange={e => updateDraft('contactRoleTitle', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Email Address <span className="text-red-500">*</span></Label>
                <Input type="email" value={draft.contactEmail} onChange={e => updateDraft('contactEmail', e.target.value)} />
              </div>

              <div className="space-y-2 border-t pt-6 mt-6">
                <Label>Portal Username <span className="text-red-500">*</span></Label>
                <Input value={draft.username} onChange={e => updateDraft('username', e.target.value)} />
                <p className="text-xs text-gray-500">This will be the user's login ID. A temporary password will be generated.</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
                <Shield className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                <p>This user will be created as an <strong>Org Admin</strong>, giving them full access to manage the organization's team, locations, and billing.</p>
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-8 max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-xl p-5 bg-white">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-lg">Organization</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium">{draft.orgName}</span></div>
                    <div><span className="text-gray-500 w-24 inline-block">Type:</span> <span className="capitalize">{draft.orgType.replace('_', ' ')}</span></div>
                  </div>
                </div>

                <div className="border rounded-xl p-5 bg-white">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                    <User className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-lg">Admin User</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium">{draft.contactFirst} {draft.contactLast}</span></div>
                    <div><span className="text-gray-500 w-24 inline-block">Email:</span> <span>{draft.contactEmail}</span></div>
                    <div><span className="text-gray-500 w-24 inline-block">Username:</span> <span className="font-mono bg-gray-100 px-1 rounded">{draft.username}</span></div>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-white">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-lg">Billing Profile</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium">{draft.billingName}</div>
                      <div className="text-gray-600">
                        {draft.billingAddress1}<br/>
                        {draft.billingAddress2 && <>{draft.billingAddress2}<br/></>}
                        {draft.billingCity}, {draft.billingState} {draft.billingZip}
                      </div>
                      <div className="mt-2 pt-2 border-t text-gray-600">
                        A/P Email: {draft.billingApEmail}
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <span className="font-medium text-primary bg-primary/5 px-2 py-1 rounded">
                          {draft.billingPaymentTerms === 'net_terms' ? `Net ${draft.billingNetDays} Terms` : 'Credit Card'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-lg">Primary Location</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium">{draft.locationNickname}</div>
                      <div className="text-gray-600">
                        {draft.locationAddress1}<br/>
                        {draft.locationAddress2 && <>{draft.locationAddress2}<br/></>}
                        {draft.locationCity}, {draft.locationState} {draft.locationZip}
                      </div>
                      {draft.locationPhone && (
                        <div className="mt-2 pt-2 border-t text-gray-600">
                          Phone: {draft.locationPhone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex gap-3">
                <Rocket className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <p>Clicking Create Account will instantly provision the HubSpot records and the portal user account. The user will be able to log in immediately.</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50/80 border-t p-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {step < 5 && 'All fields marked with * are required.'}
          </div>
          
          <div className="flex gap-3">
            {step < 5 ? (
              <Button 
                onClick={nextStep} 
                disabled={!validateStep(step)}
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                size="lg"
                className="bg-accent hover:bg-accent/90 px-8"
                disabled={onboardMutation.isPending}
              >
                {onboardMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Needed to silence ts warning if Shield isn't imported from lucide-react above
import { Shield } from 'lucide-react';
