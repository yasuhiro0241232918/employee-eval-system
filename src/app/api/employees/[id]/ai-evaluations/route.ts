import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const apiKey = req.headers.get("x-api-key") ?? "";
  if (!apiKey) return NextResponse.json({ error: "APIキーが必要です" }, { status: 400 });

  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      attendance: true, qualifications: true, experiences: true,
      accidents: true, memos: true, interviews: true,
    },
  });
  if (!emp) return NextResponse.json({ error: "not found" }, { status: 404 });

  const empData = { ...emp, photo: undefined };

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `以下の社員情報をもとに人事評価を行ってください。\n\n社員情報：\n${JSON.stringify(empData, null, 2)}\n\n以下のJSON形式のみで回答してください（マークダウン不要）：\n{\n  "score": 総合スコア（0〜100の整数）,\n  "strengths": "強みのコメント",\n  "issues": "課題のコメント",\n  "summary": "総合所見"\n}`,
      }],
    }),
  });

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}));
    return NextResponse.json({ error: (err as { error?: { message?: string } }).error?.message ?? "AI APIエラー" }, { status: 500 });
  }

  const aiData = await aiRes.json() as { content: { text: string }[] };
  const text = aiData.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: "AI応答の解析に失敗しました" }, { status: 500 });
  const result = JSON.parse(match[0]) as { score: number; strengths: string; issues: string; summary: string };

  const evaluation = await prisma.aIEvaluation.create({
    data: {
      employeeId: params.id,
      score: result.score,
      strengths: result.strengths,
      issues: result.issues,
      summary: result.summary,
    },
  });
  return NextResponse.json(evaluation, { status: 201 });
}
