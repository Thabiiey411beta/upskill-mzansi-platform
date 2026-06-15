import React, { useState } from 'react';
import { Building2, Award, Users, Calculator, ArrowRight, ShieldCheck, Landmark } from 'lucide-react';

export default function BusinessSolutions() {
  const [learnersCount, setLearnersCount] = useState<number>(5);
  const [hasDisability, setHasDisability] = useState<boolean>(false);

  const baseAllowance = hasDisability ? 120000 : 80000;
  const estimatedTaxSavings = learnersCount * baseAllowance;
  const estimatedSdlRebate = learnersCount * 4500;

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-[#0A2540] text-white p-8 rounded-2xl shadow-xl mb-8">
        <span className="bg-[#FF6B00] text-xs font-bold px-3 py-1 rounded-full uppercase">Upskill Mzansi B2B</span>
        <h1 className="text-3xl font-extrabold mt-4">Scale Your Workforce & Optimize B-BBEE Scorecards</h1>
        <p className="text-slate-300 mt-2">Connect with verified South African talent and claim back SARS tax incentives cleanly.</p>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-[#0A2540] mb-4 flex items-center gap-2">
          <Calculator className="text-[#FF6B00]" /> Section 12H Tax Incentive Calculator
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Number of Learners: <span className="text-[#FF6B00] font-bold text-lg">{learnersCount}</span>
            </label>
            <input type="range" min="1" max="50" value={learnersCount} onChange={(e) => setLearnersCount(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="disability" checked={hasDisability} onChange={(e) => setHasDisability(e.target.checked)} className="w-5 h-5 accent-[#22C55E]" />
            <label htmlFor="disability" className="text-sm text-slate-600">Include Learners with Confirmed Disabilities (+R40,000 allowance)</label>
          </div>
          <div className="bg-slate-900 text-white p-6 rounded-xl mt-4">
            <span className="text-xs text-slate-400 block uppercase font-semibold">Estimated Gross Corporate Tax Deduction</span>
            <div className="text-3xl font-bold text-[#22C55E] mt-1">R {estimatedTaxSavings.toLocaleString('en-ZA')}</div>
            <div className="text-xs text-slate-400 mt-2">Estimated SDL Rebate Return: R {estimatedSdlRebate.toLocaleString('en-ZA')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
