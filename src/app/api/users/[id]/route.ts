import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { withAdmin } from "@/lib/api-auth";

export const GET = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        avatar: users.avatar,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Kullanıcı yüklenirken hata oluştu" },
      { status: 500 },
    );
  }
});

export const PATCH = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, phone, isActive, password } = body;

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 },
      );
    }

    if (email) {
      const [emailCheck] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailCheck && emailCheck.id !== id) {
        return NextResponse.json(
          { error: "Bu email adresi zaten kullanılıyor" },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Kullanıcı güncellenirken hata oluştu" },
      { status: 500 },
    );
  }
});

export const DELETE = withAdmin(async (request, { params }) => {
  try {
    const { id } = await params;

    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 },
      );
    }

    const [deletedUser] = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email });

    return NextResponse.json({
      success: true,
      message: "Kullanıcı devre dışı bırakıldı",
      user: deletedUser,
    });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json(
      { error: "Kullanıcı silinirken hata oluştu" },
      { status: 500 },
    );
  }
});
