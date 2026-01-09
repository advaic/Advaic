"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function ProfileForm() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    language: "de",
  });

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send to backend or store
    console.log("Saving profile:", profile);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-bold">Persönliche Daten</h1>
      <p className="text-muted-foreground">
        Diese Angaben werden für Kommunikation, Rechnungen und Kontozugriff
        verwendet.
      </p>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Vorname</Label>
          <Input
            id="firstName"
            value={profile.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nachname</Label>
          <Input
            id="lastName"
            value={profile.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">E-Mail-Adresse</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefonnummer</Label>
          <Input
            id="phone"
            type="tel"
            value={profile.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="company">Firmenname (optional)</Label>
          <Input
            id="company"
            value={profile.company}
            onChange={(e) => handleChange("company", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="language">Sprache</Label>
          <select
            id="language"
            className="w-full border rounded-md p-2 text-sm"
            value={profile.language}
            onChange={(e) => handleChange("language", e.target.value)}
          >
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
          </select>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit">Einstellungen speichern</Button>
      </div>
    </form>
  );
}
