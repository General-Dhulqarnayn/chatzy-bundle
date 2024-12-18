import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MessageSquare, Calculator, BookOpen, Beaker } from "lucide-react";

interface RoomSelectionFormProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}

const RoomSelectionForm = ({ selectedCategory, onCategoryChange }: RoomSelectionFormProps) => {
  return (
    <RadioGroup
      defaultValue="general"
      value={selectedCategory}
      onValueChange={onCategoryChange}
      className="grid grid-cols-2 gap-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="general" id="general" />
        <Label htmlFor="general" className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>General</span>
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="maths" id="maths" />
        <Label htmlFor="maths" className="flex items-center space-x-2">
          <Calculator className="h-4 w-4" />
          <span>Maths</span>
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="english" id="english" />
        <Label htmlFor="english" className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4" />
          <span>English</span>
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="science" id="science" />
        <Label htmlFor="science" className="flex items-center space-x-2">
          <Beaker className="h-4 w-4" />
          <span>Science</span>
        </Label>
      </div>
    </RadioGroup>
  );
};

export default RoomSelectionForm;