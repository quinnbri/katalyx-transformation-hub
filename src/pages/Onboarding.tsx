import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const industries = [
  "Financial Services",
  "Healthcare & Life Sciences",
  "Technology & Software",
  "Retail & E-Commerce",
  "Manufacturing",
  "Energy & Utilities",
  "Telecommunications",
  "Media & Entertainment",
  "Government & Public Sector",
  "Education",
  "Transportation & Logistics",
  "Professional Services",
  "Other",
];

const companySizes = [
  "1–50",
  "51–200",
  "201–500",
  "501–1,000",
  "1,001–5,000",
  "5,001–10,000",
  "10,001–50,000",
  "50,000+",
];

const techTeamSizes = [
  "1–100",
  "101–500",
  "501–1,000",
  "1,001–3,000",
  "3,001–5,000",
  "5,001–10,000",
  "10,001+",
];

const infrastructureTypes = [
  "Cloud-native",
  "Hybrid (Cloud + On-prem)",
  "Primarily On-prem",
  "Multi-cloud",
  "Colocation",
];

const cloudProviders = [
  "AWS",
  "Microsoft Azure",
  "Google Cloud (GCP)",
  "Oracle Cloud",
  "IBM Cloud",
  "Alibaba Cloud",
  "Other / Private Cloud",
];


export default function Onboarding() {
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [techTeamSize, setTechTeamSize] = useState("");
  const [infraType, setInfraType] = useState("");
  const [selectedClouds, setSelectedClouds] = useState<string[]>([]);
  const [company, setCompany] = useState("");

  // Pre-fill from agent conversation metadata
  useEffect(() => {
    try {
      const stored = localStorage.getItem("katalyx_user_metadata");
      if (!stored) return;
      const meta = JSON.parse(stored);
      if (meta.company) setCompany(meta.company);
      if (meta.industry && industries.includes(meta.industry)) setIndustry(meta.industry);
      if (meta.company_size && companySizes.includes(meta.company_size)) setCompanySize(meta.company_size);
      if (meta.tech_team_size && techTeamSizes.includes(meta.tech_team_size)) setTechTeamSize(meta.tech_team_size);
      if (meta.infrastructure_type && infrastructureTypes.includes(meta.infrastructure_type)) setInfraType(meta.infrastructure_type);
      if (meta.cloud_providers?.length) {
        const valid = meta.cloud_providers.filter((p: string) => cloudProviders.includes(p));
        if (valid.length) setSelectedClouds(valid);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  const toggleCloud = (provider: string) => {
    setSelectedClouds((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!industry || !companySize || !techTeamSize || !infraType) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        company: company || null,
        industry,
        company_size: companySize,
        tech_team_size: techTeamSize,
        infrastructure_type: infraType,
        cloud_providers: selectedClouds.length > 0 ? selectedClouds : null,
        onboarding_completed: true,
      } as any)
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-coral-400"></div>
            <span className="text-2xl font-bold bg-gradient-to-br from-teal-600 to-coral-400 bg-clip-text text-transparent">
              KATALYX
            </span>
          </div>
          <CardTitle className="text-2xl">Tell us about your organization</CardTitle>
          <CardDescription>
            This helps us benchmark your results against similar companies and provide tailored recommendations.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label>Industry *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Two columns */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Size (employees) *</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {companySizes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tech Team Size *</Label>
                <Select value={techTeamSize} onValueChange={setTechTeamSize}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {techTeamSizes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="space-y-2">
              <Label>Infrastructure Environment *</Label>
              <Select value={infraType} onValueChange={setInfraType}>
                <SelectTrigger><SelectValue placeholder="Select environment" /></SelectTrigger>
                <SelectContent>
                  {infrastructureTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cloud Providers */}
            <div className="space-y-3">
              <Label>Cloud Providers (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {cloudProviders.map((provider) => (
                  <label
                    key={provider}
                    className="flex items-center space-x-2 rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedClouds.includes(provider)}
                      onCheckedChange={() => toggleCloud(provider)}
                    />
                    <span className="text-sm">{provider}</span>
                  </label>
                ))}
              </div>
            </div>


            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Continue to Dashboard"
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
