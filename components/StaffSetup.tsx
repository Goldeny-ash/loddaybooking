"use client";



import { useEffect, useState } from "react";

import axios from "axios";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import {

  Select,

  SelectTrigger,

  SelectContent,

  SelectItem,

  SelectValue,

} from "@/components/ui/select";



interface Staff {

  _id: string;

  name: string;

  role: string;

  photo?: string;

  specialties?: string[];

}



const ROLES = [

  "stylist",

  "barber",

  "therapist",

  "masseuse",

  "other",

];



export default function StaffSetup() {

  const [staff, setStaff] = useState<Staff[]>([]);

  const [name, setName] = useState("");

  const [role, setRole] = useState("stylist");

  const [customRole, setCustomRole] = useState("");

  const [specialty, setSpecialty] = useState("");

  const [specialties, setSpecialties] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);



  async function fetchStaff() {

    const res = await axios.get("/api/staff");

    setStaff(res.data.staff || []);

  }



  useEffect(() => {

    fetchStaff();

  }, []);



  function addSpecialty() {

    if (!specialty) return;

    setSpecialties((prev) => [...new Set([...prev, specialty])]);

    setSpecialty("");

  }



  async function addStaff() {

    if (!name) return;



    const finalRole =

      role === "other" && customRole

        ? customRole

        : role;



    setLoading(true);



    try {

      await axios.post("/api/staff", {

        name,

        role: finalRole,

        specialties,

      });



      setName("");

      setRole("stylist");

      setCustomRole("");

      setSpecialties([]);

      fetchStaff();

    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="bg-white/80 backdrop-blur-md rounded-[32px] shadow-xl p-10 space-y-8">



      {/* HEADER */}

      <div>

        <h2 className="text-3xl font-serif text-[#001524]">

          Add Your Team

        </h2>

        <p className="text-[#15616D]">

          Add employees who will be bookable online.

        </p>

      </div>



      {/* OPTIONAL LABEL */}

      <div className="text-sm text-gray-500">

        Optional — You can skip this step and add staff later.

      </div>



      {/* QUICK ADD OWNER */}

      <Button

        variant="outline"

        onClick={() => {

          setName("Me");

          setRole("stylist");

        }}

      >

        + Add Yourself

      </Button>



      {/* EXISTING STAFF */}

      {staff.length > 0 && (

        <div className="grid gap-4">

          {staff.map((s) => (

            <div

              key={s._id}

              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex justify-between shadow-sm border border-white/40"

            >

              <div>

                <p className="font-medium">{s.name}</p>

                <p className="text-sm text-gray-500 capitalize">

                  {s.role}

                </p>

              </div>

            </div>

          ))}

        </div>

      )}



      {/* INPUT SECTION */}

      <div className="grid md:grid-cols-3 gap-4">



        {/* NAME */}

        <Input

          placeholder="Staff name (optional)"

          value={name}

          onChange={(e) => setName(e.target.value)}

        />



        {/* GLASS MORPHISM ROLE SELECT */}

        <Select value={role} onValueChange={setRole}>

          <SelectTrigger

            className="

              rounded-xl

              bg-white/60

              backdrop-blur-md

              border border-white/40

              shadow-sm

            "

          >

            <SelectValue placeholder="Role" />

          </SelectTrigger>



          <SelectContent

            className="

              backdrop-blur-xl

              bg-white/30

              border border-white/40

              shadow-2xl

              rounded-2xl

              p-2

            "

          >

            {ROLES.map((r) => (

              <SelectItem

                key={r}

                value={r}

                className="

                  rounded-lg

                  cursor-pointer

                  hover:bg-white/40

                  focus:bg-white/50

                  transition

                "

              >

                {r}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>



        {/* SPECIALTY INPUT */}

        <div className="flex gap-2">

          <Input

            placeholder="Specialty (optional)"

            value={specialty}

            onChange={(e) => setSpecialty(e.target.value)}

          />

          <Button onClick={addSpecialty} variant="outline">

            Add

          </Button>

        </div>

      </div>



      {/* CUSTOM ROLE INPUT */}

      {role === "other" && (

        <div>

          <Input

            placeholder="Enter custom job title"

            value={customRole}

            onChange={(e) =>

              setCustomRole(e.target.value)

            }

          />

        </div>

      )}



      {/* SPECIALTIES TAGS */}

      {specialties.length > 0 && (

        <div className="flex gap-2 flex-wrap">

          {specialties.map((s) => (

            <span

              key={s}

              className="px-3 py-1 rounded-full bg-[#F3DCC4] text-xs"

            >

              {s}

            </span>

          ))}

        </div>

      )}



      <Button

        onClick={addStaff}

        disabled={loading}

        className="bg-[#15616D] text-white rounded-full"

      >

        Add Staff Member

      </Button>

    </div>

  );

}