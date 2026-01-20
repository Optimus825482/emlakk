import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { withAdmin } from "@/lib/api-auth";

export const GET = withAdmin(async () => {
  try {
    const allUsers = await db
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
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Kullanicilar yuklenirken hata olustu" },
      { status: 500 }
    );
  }
});

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Ad, email ve sifre zorunludur" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kullaniliyor" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: role || "viewer",
        phone: phone || null,
        isActive: true,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("User create error:", error);
    return NextResponse.json(
      { error: "Kullanici olusturulurken hata olustu" },
      { status: 500 }
    );
  }
});

export const PUT = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, name, email, role, phone, isActive, password } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Kullanici ID gerekli" },
        { status: 400 }
      );
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

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Kullanici bulunamadi" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Kullanici guncellenirken hata olustu" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Kullanici ID gerekli" },
        { status: 400 }
      );
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!deletedUser) {
      return NextResponse.json(
        { error: "Kullanici bulunamadi" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: deletedUser.id });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json(
      { error: "Kullanici silinirken hata olustu" },
      { status: 500 }
    );
  }
});
