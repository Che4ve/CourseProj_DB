"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setAccessToken, clearAccessToken } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function login(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	try {
		// ✅ БЕЗОПАСНОСТЬ: Пароль передаётся в HTTPS POST-запросе.
		// В production используйте только HTTPS для защиты данных в transit.
		const response = await fetch(`${API_URL}/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			return { error: error.message || "Ошибка входа" };
		}

		const data = await response.json();
		await setAccessToken(data.access_token); // ✅ Backend возвращает access_token (snake_case)

		revalidatePath("/", "layout");
	} catch (error) {
		return { error: "Ошибка соединения с сервером" };
	}

	redirect("/");
}

export async function signup(formData: FormData) {
	const fullName = formData.get("fullName") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	try {
		// ✅ БЕЗОПАСНОСТЬ: Пароль передаётся в HTTPS POST-запросе.
		// В production используйте только HTTPS для защиты данных в transit.
		const response = await fetch(`${API_URL}/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ fullName, email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			return { error: error.message || "Ошибка регистрации" };
		}

		const data = await response.json();
		await setAccessToken(data.access_token); // ✅ Backend возвращает access_token (snake_case)

		revalidatePath("/", "layout");
	} catch (error) {
		return { error: "Ошибка соединения с сервером" };
	}

	redirect("/");
}

export async function logout() {
	await clearAccessToken();
	revalidatePath("/", "layout");
	redirect("/login");
}
