import { useRef, useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";
import type { CreateEventTabProps } from "~/types";

const CreateEventTab = ({
  eventForm,
  handleEventChange,
  saveEvent,
  setEventForm,
}: CreateEventTabProps) => {
  const waiverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentWaiverUrl, setCurrentWaiverUrl] = useState<string | null>(null);

  // Fetch current image URL when editing an event
  useEffect(() => {
    const fetchCurrentImage = async () => {
      if (eventForm.image_id) {
        try {
          // Get the file info from storage
          const { data: files, error } = await supabase.storage
            .from("events")
            .list("images", { limit: 1000 });

          if (error) throw error;

          // Find the file with matching ID
          const imageFile = files?.find((file) => file.id === eventForm.image_id);

          if (imageFile) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("events").getPublicUrl(`images/${imageFile.name}`);
            setCurrentImageUrl(publicUrl);
          } else {
            setCurrentImageUrl(null);
          }
        } catch (error) {
          console.error("Error fetching current image:", error);
          setCurrentImageUrl(null);
        }
      } else {
        setCurrentImageUrl(null);
      }
    };

    fetchCurrentImage();
  }, [eventForm.image_id]);

  // Fetch current waiver URL when editing an event
  useEffect(() => {
    const fetchCurrentWaiver = async () => {
      if (eventForm.waiver_id) {
        try {
          // Get the file info from storage
          const { data: files, error } = await supabase.storage
            .from("events")
            .list("waivers", { limit: 1000 });

          if (error) throw error;

          // Find the file with matching ID
          const waiverFile = files?.find((file) => file.id === eventForm.waiver_id);

          if (waiverFile) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("events").getPublicUrl(`waivers/${waiverFile.name}`);
            setCurrentWaiverUrl(publicUrl);
          } else {
            setCurrentWaiverUrl(null);
          }
        } catch (error) {
          console.error("Error fetching current waiver:", error);
          setCurrentWaiverUrl(null);
        }
      } else {
        setCurrentWaiverUrl(null);
      }
    };

    fetchCurrentWaiver();
  }, [eventForm.waiver_id]);

  return (
    <section>
      <form
        onSubmit={(e) =>
          saveEvent(e, waiverInputRef.current?.files?.[0], imageInputRef.current?.files?.[0])
        }
        className="space-y-4 max-w-xl mx-auto"
      >
        <div>
          <label htmlFor="event-title" className="block mb-1 font-semibold">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            id="event-title"
            name="title"
            value={eventForm.title}
            onChange={handleEventChange}
            placeholder="Event Title"
            required
            className="formInput"
            aria-label="Event title"
          />
        </div>
        <div>
          <label htmlFor="event-description" className="block mb-1 font-semibold">
            Event Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="event-description"
            name="description"
            value={eventForm.description}
            onChange={handleEventChange}
            placeholder="Event Description"
            required
            className="formInput"
            aria-label="Event description"
          />
        </div>
        <div>
          <label htmlFor="event-date" className="block mb-1 font-semibold">
            Event Date <span className="text-red-500">*</span>
          </label>
          <input
            id="event-date"
            type="date"
            name="date"
            value={eventForm.date}
            onChange={handleEventChange}
            required
            className="formInput"
            aria-label="Event date"
          />
        </div>
        <div>
          <label htmlFor="event-time" className="block mb-1 font-semibold">
            Event Time <span className="text-red-500">*</span>
          </label>
          <input
            id="event-time"
            type="time"
            name="time"
            value={eventForm.time}
            onChange={handleEventChange}
            required
            className="formInput"
            aria-label="Event time"
          />
        </div>
        <div>
          <label htmlFor="event-location" className="block mb-1 font-semibold">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            id="event-location"
            name="location"
            value={eventForm.location}
            onChange={handleEventChange}
            placeholder="Location"
            required
            className="formInput"
            aria-label="Event location"
          />
        </div>
        <div>
          <label htmlFor="event-image" className="block mb-1 font-semibold">
            Event Image (Optional)
          </label>
          <input
            id="event-image"
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="formInput"
            aria-label="Upload event image"
            title="Upload an image for the event"
          />
          {currentImageUrl && (
            <div className="mt-2">
              <p className="text-xs mb-1">Current image:</p>
              <img
                src={currentImageUrl}
                alt="Event preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="waiver_required"
            checked={eventForm.waiver_required}
            onChange={handleEventChange}
          />
          Waiver Required?
        </label>
        {eventForm.waiver_required && (
          <div>
            <label htmlFor="waiver-file" className="block mb-1 font-semibold">
              Upload Waiver PDF <span className="text-red-600">*</span>
            </label>
            <input
              id="waiver-file"
              type="file"
              accept="application/pdf"
              ref={waiverInputRef}
              className="formInput"
              required={!eventForm.waiver_id}
              aria-label="Upload waiver PDF file"
              title="Upload a PDF waiver file for the event"
            />
            {currentWaiverUrl && eventForm.date >= new Date().toISOString().split("T")[0] && (
              <p className="text-xs mt-1">
                Current:{" "}
                <a
                  href={currentWaiverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-700"
                >
                  Download Existing Waiver
                </a>
              </p>
            )}
          </div>
        )}
        <button
          type="submit"
          className="bg-[#8a9663] text-white font-semibold px-6 py-2 rounded-full"
        >
          {eventForm.id ? "Update Event" : "Create Event"}
        </button>
        {eventForm.id && (
          <button
            type="button"
            onClick={() =>
              setEventForm({
                id: "",
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                waiver_required: false,
                waiver_id: undefined,
                image_id: undefined,
              })
            }
            className="ml-4 bg-gray-300 hover:bg-gray-400 rounded-full px-6 py-2"
          >
            Cancel Edit
          </button>
        )}
      </form>
    </section>
  );
};

export default CreateEventTab;
