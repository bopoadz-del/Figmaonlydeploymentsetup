import { Award, Star, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function EvidenceLegend() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="w-4 h-4" />
          Evidence Layer Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-blue-900 mb-2">What is Evidence?</p>
          <p className="text-blue-800">
            Industry analyst rankings and certifications that provide transparent score boosts (capped at +10 points total).
          </p>
        </div>
        
        <div>
          <p className="font-semibold text-blue-900 mb-2">Common Sources:</p>
          <div className="space-y-1 text-blue-800">
            <div className="flex items-center gap-2">
              <Award className="w-3 h-3" />
              <span><strong>Gartner/Forrester:</strong> IT analyst rankings (18mo decay)</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3" />
              <span><strong>G2:</strong> Customer reviews & satisfaction (12mo decay)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              <span><strong>Sector-Specific:</strong> ENR, BloombergNEF, LEED, etc.</span>
            </div>
          </div>
        </div>
        
        <div>
          <p className="font-semibold text-blue-900 mb-2">Badge Colors:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 border border-green-200">
              🟢 Leader/Tier 1
            </span>
            <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800 border border-amber-200">
              🟡 Strong/Tier 2
            </span>
            <span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
              🔵 Visionary/Tier 3
            </span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> Click "Seed Evidence Data" to load sample evidence, 
            then search for PANW, ZS, SNOW, NEE, CRH, or KO to see badges in action.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
