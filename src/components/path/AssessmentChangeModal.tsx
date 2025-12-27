import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Archive, X } from 'lucide-react';

interface AssessmentChangeModalProps {
  open: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  onKeepCurrent: () => void;
  isRegenerating: boolean;
}

export function AssessmentChangeModal({
  open,
  onClose,
  onRegenerate,
  onKeepCurrent,
  isRegenerating,
}: AssessmentChangeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Assessment Results Changed
          </DialogTitle>
          <DialogDescription>
            Your assessment results have changed. Would you like to regenerate your Skill Path based on your updated profile?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="chamfer-sm bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-2">What happens if you regenerate:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your current path will be archived for reference</li>
              <li>• A new path will be generated using your latest results</li>
              <li>• Your progress will be reset on the new path</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onKeepCurrent}
            disabled={isRegenerating}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Keep Current Path
          </Button>
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="gradient-primary text-primary-foreground w-full sm:w-auto"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Yes, Regenerate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
