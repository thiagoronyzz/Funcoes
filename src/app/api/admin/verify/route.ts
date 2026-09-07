import { NextRequest, NextResponse } from "next/server";

const ADMIN_CODE = process.env.ADMIN_CODE || "ADMIN2024";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { valid: false, error: "Código é obrigatório" },
        { status: 400 }
      );
    }

    const isValid = code.trim() === ADMIN_CODE;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Error verifying admin code:", error);
    return NextResponse.json(
      { valid: false, error: "Erro ao verificar código" },
      { status: 500 }
    );
  }
}
