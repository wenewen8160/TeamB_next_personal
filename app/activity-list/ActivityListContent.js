"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import Styles from "./activity-list.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { AL_LIST } from "@/config/api-path";
import { ACTIVITY_ADD_POST } from "@/config/activity-registered-api-path";
import ActivityCard from "@/components/activity-list-card/ActivityCard";
import { useAuth } from "@/context/auth-context";
import Swal from "sweetalert2";
import ScrollToTopButton from "@/components/ScrollToTopButton";

export default function ActivityListContent() {
  const { auth } = useAuth();
  const searchParams = useSearchParams();
  const keywordFromURL = searchParams.get("search");
  const [sortType, setSortType] = useState("date");
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();
  const searchRef = useRef();
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityName, setActivityName] = useState(null);
  const [selectedPeople, setSelectedPeople] = useState(1);
  const [notes, setNotes] = useState("");
  const modalRef = useRef(null);
  const bsModal = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [originalData, setOriginalData] = useState([]);
  const [isShow, setIsShow] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [afterRegisterCallback, setAfterRegisterCallback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = listData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const [registeredIds, setRegisteredIds] = useState([]);

  const handlePageChange = (page) => {
    if (page !== currentPage) setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query) => {
    setSearchInput(query);
    setSearchQuery(query);
    setIsShow(true);
    if (query.trim() === "") {
      setIsShow(false);
      setListData(originalData);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = originalData.filter((activity) =>
        activity.activity_name.toLowerCase().includes(lowerQuery) ||
        activity.court_name.toLowerCase().includes(lowerQuery) ||
        activity.name.toLowerCase().includes(lowerQuery)
      );
      setListData(filtered);
    }
  };

  const clearSearch = () => {
    searchRef.current.value = "";
    setIsShow(false);
    fetchData();
    setSearchInput("");
    router.replace("/activity-list");
  };

  useEffect(() => {
    if (keywordFromURL) setSearchInput(keywordFromURL);
  }, [keywordFromURL]);

  useEffect(() => {
    if (keywordFromURL && originalData.length > 0) handleSearch(keywordFromURL);
  }, [originalData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const bootstrap = require("bootstrap");
      if (modalRef.current) bsModal.current = new bootstrap.Modal(modalRef.current);
    }
  }, []);

  const openModal = () => { if (bsModal.current) bsModal.current.show(); };
  const closeModal = () => { if (bsModal.current) bsModal.current.hide(); };

  const fetchData = async () => {
    try {
      if (typeof window === "undefined") return;
      const userData = localStorage.getItem("TEAM_B-auth");
      const token = userData ? JSON.parse(userData).token : "";

      const r = await fetch(`${AL_LIST}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const obj = await r.json();
      if (obj.success) {
        const now = new Date();
        const validActivities = obj.rows.filter((a) => new Date(a.activity_time) >= now);
        const sorted = [...validActivities].sort((a, b) => new Date(b.activity_time) - new Date(a.activity_time));
        setOriginalData(validActivities);
        setListData(sorted);
      }
    } catch (error) {
      console.warn("fetchData 錯誤:", error);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    if (!activityName || !activityName.al_id) {
      Swal.fire({ icon: "warning", text: "請選擇活動", confirmButtonText: "確定", confirmButtonColor: "#29755D" });
      setLoading(false);
      return;
    }

    const formData = {
      member_id: auth.id,
      activity_id: activityName.al_id,
      num: selectedPeople,
      notes: notes.trim(),
    };

    try {
      const response = await fetch(ACTIVITY_ADD_POST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setNotes("");
        setSelectedPeople(1);
        setRegisteredIds((prev) => [...prev, activityName.al_id]);
        if (typeof afterRegisterCallback === "function") {
          afterRegisterCallback();
          setAfterRegisterCallback(null);
        }
        Swal.fire({ icon: "success", text: "活動報名成功", confirmButtonText: "確定", confirmButtonColor: "#29755D" });
        closeModal();
        await fetchData();
      }
    } catch (error) {
      console.error("報名失敗", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const savedPage = sessionStorage.getItem("currentPage");
    if (savedPage) setCurrentPage(parseInt(savedPage, 10));
    const savedPosition = sessionStorage.getItem("scrollPosition");
    if (savedPosition) window.scrollTo({ top: parseInt(savedPosition, 10), behavior: "auto" });
  }, []);

  const handleSortChange = (sortBy) => {
    const sorted = [...listData];
    switch (sortBy) {
      case "date": sorted.sort((a, b) => new Date(b.activity_time) - new Date(a.activity_time)); break;
      case "location": sorted.sort((a, b) => a.court_name.localeCompare(b.court_name)); break;
      case "price": sorted.sort((a, b) => a.payment - b.payment); break;
      case "people": sorted.sort((a, b) => b.registered_people - a.registered_people); break;
      default: break;
    }
    setListData(sorted);
  };

  return (
    <>
      {/* 頁面內容略...（與你原本 page.js 相同） */}
      <ScrollToTopButton />
    </>
  );
}
