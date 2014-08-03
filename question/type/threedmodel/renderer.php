<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * threedmodel 'question' renderer class.
 *
 * @package    qtype
 * @subpackage threedmodel
 * @copyright  2009 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/**
 * Generates the output for threedmodel 'question's.
 *
 * @copyright  2009 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qtype_threedmodel_renderer extends qtype_renderer {

    public function formulation_and_controls(question_attempt $qa, question_display_options $options) {
        global $PAGE;
        global $CFG;
        $model_file_url = self::get_model_url($qa, 'threedmodel');

        $htmlCode = '';

        if ($model_file_url) {
            $htmlCode .= $model_file_url;
        }

        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/mod/threedmodel/lib/three.min.js'));
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/mod/threedmodel/lib/ColladaLoader.js'));
        $PAGE->requires->js(new moodle_url($CFG->wwwroot . '/mod/threedmodel/lib/OrbitControls.js'));

        $PAGE->requires->js_init_call('M.qtype_threedmodel.init', array((string) $model_file_url));

        //      return '<div>'.$htmlCode.'</div>';
        return html_writer::tag('div', '', array('id' => 'threedmodelContainer'));
    }

    public function formulation_heading() {
        return get_string('informationtext', 'qtype_threedmodel');
    }

    protected static function get_model_url(question_attempt $qa, $filearea, $itemid = 0) {
        $question = $qa->get_question();
        $qubaid = $qa->get_usage_id();
        $slot = $qa->get_slot();
        $fs = get_file_storage();
        if ($filearea == 'threedmodel') {
            $itemid = $question->id;
        }
        $componentname = $question->qtype->plugin_name();
        $draftfiles = $fs->get_area_files($question->contextid, $componentname, $filearea, $itemid, 'id');
        if ($draftfiles) {
            foreach ($draftfiles as $file) {
                if ($file->is_directory()) {
                    continue;
                }
                $url = moodle_url::make_pluginfile_url($question->contextid, $componentname, $filearea, "$qubaid/$slot/{$itemid}", '/', $file->get_filename());
                return $url->out();
            }
        }
        return null;
    }

}
